import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

import './App.css';
import { GameScreen } from './pages/GameScreen';
import { QUIZ_QUESTIONS } from './data/questions';
import {
  CELEBRATION_DURATION_MS,
  DEDUPE_ACTION_WINDOW_MS,
  MAX_PENDING_VOICE_EVENTS,
  NEXT_QUESTION_DELAY_MS,
  VOICE_ACK_TIMEOUT_MS,
  VOICE_BLOCKING_MIN_SETTLE_MS,
  VOICE_PROMPT_LOCK_BASE_MS,
  VOICE_PROMPT_LOCK_MAX_MS,
  VOICE_PROMPT_LOCK_MIN_MS,
  VOICE_PROMPT_LOCK_PER_CHAR_MS,
  VOICE_RETRY_DELAY_MS,
} from './game/config';
import { GAME_PHASES } from './game/states';
import {
  applyAnswer,
  advanceToNextQuestion,
  createGameStartedEvent,
  createInitialGameState,
  createInvalidActionEvent,
  createQuestionPromptEvent,
  createResultPromptEvent,
  createScoreReportEvent,
  toAssistantState,
} from './game/engine/gameEngine';
import {
  ACTION_TYPES,
  INVALID_ACTION_REASONS,
  getActionSignature,
  validateIncomingAction,
  validateOutgoingEvent,
} from './game/voice/contract';
import {
  VOICE_EVENT_POLICIES,
  VoiceEventScheduler,
} from './game/voice/scheduler';

const DEBUG_SMARTAPP_NAME = 'Quiz';
const VOICE_LOCK_EVENT_TYPES = new Set([
  'game_started',
  'question_prompt',
]);

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP || DEBUG_SMARTAPP_NAME}`,
      getState,
      nativePanel: {
        defaultText: 'Говорите!',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  }

  return createAssistant({ getState });
};

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      game: createInitialGameState(QUIZ_QUESTIONS),
      celebrationType: 'success',
      celebrationNonce: 0,
      isVoicePromptLocked: false,
    };

    this.celebrationTimer = null;
    this.nextQuestionTimer = null;
    this.initialAnnouncementTimer = null;
    this.voicePromptLockTimer = null;
    this.voicePromptLockId = 0;
    this.hasAnnouncedWelcome = false;
    this.lastActionSignature = '';
    this.lastActionAt = 0;
    this.assistant = initializeAssistant(() => this.getStateForAssistant());
    this.voiceScheduler = new VoiceEventScheduler({
      getGameState: () => this.state.game,
      sendPayload: (event, settle) => this.sendVoicePayload(event, settle),
      onError: (error, event) => {
        console.error('Failed to flush queued voice event.', event, error);
      },
      onTrace: process.env.REACT_APP_VOICE_DEBUG === 'true'
        ? (entry) => console.debug('[voice]', entry)
        : null,
      maxPendingEvents: MAX_PENDING_VOICE_EVENTS,
      ackTimeoutMs: VOICE_ACK_TIMEOUT_MS,
      retryDelayMs: VOICE_RETRY_DELAY_MS,
      minBlockingSettleMs: VOICE_BLOCKING_MIN_SETTLE_MS,
    });

    this.assistant.on('data', (event) => {
      if (!event || typeof event !== 'object') {
        return;
      }

      if (event.type === 'character' || event.type === 'insets') {
        return;
      }

      this.dispatchAssistantAction(event.action);
    });

    this.assistant.on('start', () => {
      this.voiceScheduler.setReady(true);
      this.scheduleInitialAnnouncement();
    });

    this.assistant.on('error', (event) => {
      console.error('Assistant transport error.', event);
    });

    this.assistant.on('tts', (event) => {
      this.traceVoice('assistant_tts', {
        event,
      });
    });
  }

  componentDidMount() {
    this.initialAnnouncementTimer = setTimeout(() => {
      this.scheduleInitialAnnouncement();
    }, 1200);
  }

  componentWillUnmount() {
    if (this.celebrationTimer) {
      clearTimeout(this.celebrationTimer);
    }

    if (this.nextQuestionTimer) {
      clearTimeout(this.nextQuestionTimer);
    }

    if (this.initialAnnouncementTimer) {
      clearTimeout(this.initialAnnouncementTimer);
    }

    if (this.voicePromptLockTimer) {
      clearTimeout(this.voicePromptLockTimer);
    }

    this.voiceScheduler.dispose();
  }

  traceVoice(status, details = {}) {
    if (process.env.REACT_APP_VOICE_DEBUG === 'true') {
      console.debug('[voice]', {
        status,
        ...details,
      });
    }
  }

  getVoicePromptLockDuration(phrase) {
    const normalizedPhrase = typeof phrase === 'string' ? phrase.trim() : '';
    const estimatedMs =
      VOICE_PROMPT_LOCK_BASE_MS + normalizedPhrase.length * VOICE_PROMPT_LOCK_PER_CHAR_MS;

    return Math.min(
      Math.max(estimatedMs, VOICE_PROMPT_LOCK_MIN_MS),
      VOICE_PROMPT_LOCK_MAX_MS
    );
  }

  releaseVoicePromptLock() {
    this.voicePromptLockId += 1;

    if (this.voicePromptLockTimer) {
      clearTimeout(this.voicePromptLockTimer);
      this.voicePromptLockTimer = null;
    }

    if (this.state.isVoicePromptLocked) {
      this.setState({ isVoicePromptLocked: false });
    }
  }

  lockAnswersForVoicePrompt(event) {
    if (!VOICE_LOCK_EVENT_TYPES.has(event.eventType)) {
      return;
    }

    const phrase = event.payload && typeof event.payload.phrase === 'string'
      ? event.payload.phrase
      : '';
    const durationMs = this.getVoicePromptLockDuration(phrase);
    const lockId = this.voicePromptLockId + 1;
    this.voicePromptLockId = lockId;

    if (this.voicePromptLockTimer) {
      clearTimeout(this.voicePromptLockTimer);
    }

    this.setState({ isVoicePromptLocked: true });
    this.traceVoice('ui_answers_locked', {
      eventType: event.eventType,
      voiceTurnId: event.payload && event.payload.voiceTurnId,
      phraseLength: phrase.length,
      durationMs,
    });

    this.voicePromptLockTimer = setTimeout(() => {
      if (lockId !== this.voicePromptLockId) {
        return;
      }

      this.voicePromptLockTimer = null;
      this.setState({ isVoicePromptLocked: false });
      this.traceVoice('ui_answers_unlocked', {
        eventType: event.eventType,
        voiceTurnId: event.payload && event.payload.voiceTurnId,
      });
    }, durationMs);
  }

  getStateForAssistant() {
    return {
      game: toAssistantState(this.state.game),
    };
  }

  sendVoicePayload(event, onSettled) {
    const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};
    const data = {
      action: {
        action_id: event.eventType,
        parameters: payload,
      },
    };

    this.lockAnswersForVoicePrompt(event);
    this.traceVoice('sendData_call', {
      eventType: event.eventType,
      voiceTurnId: payload.voiceTurnId,
      phase: payload.phase,
      questionIndex: payload.questionIndex,
      phraseLength: typeof payload.phrase === 'string' ? payload.phrase.length : 0,
      phrase: payload.phrase,
    });

    let unsubscribe;
    unsubscribe = this.assistant.sendData(data, () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }

      this.traceVoice('sendData_callback', {
        eventType: event.eventType,
        voiceTurnId: payload.voiceTurnId,
        phase: payload.phase,
        questionIndex: payload.questionIndex,
      });

      if (typeof onSettled === 'function') {
        onSettled();
      }
    });
  }

  sendGameEvent(event, { policy = VOICE_EVENT_POLICIES.ENQUEUE } = {}) {
    if (!event || typeof event.eventType !== 'string') {
      return;
    }

    const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};
    if (!validateOutgoingEvent(event.eventType, payload)) {
      console.error('Refused to send invalid game event payload.', event);
      return;
    }

    this.voiceScheduler.enqueue(event, { policy });
  }

  rememberAction(action) {
    const signature = getActionSignature(action);
    if (!signature) {
      return false;
    }

    const now = Date.now();
    if (signature === this.lastActionSignature && now - this.lastActionAt < DEDUPE_ACTION_WINDOW_MS) {
      return false;
    }

    this.lastActionSignature = signature;
    this.lastActionAt = now;
    return true;
  }

  scheduleInitialAnnouncement() {
    if (this.hasAnnouncedWelcome) {
      return;
    }

    this.hasAnnouncedWelcome = true;
    this.sendGameEvent(createGameStartedEvent(this.state.game));
  }

  triggerCelebration(type = 'success') {
    if (this.celebrationTimer) {
      clearTimeout(this.celebrationTimer);
    }

    this.setState((prevState) => ({
      celebrationType: type,
      celebrationNonce: prevState.celebrationNonce + 1,
    }));

    this.celebrationTimer = setTimeout(() => {
      this.setState({ celebrationNonce: 0 });
    }, CELEBRATION_DURATION_MS);
  }

  clearPendingTransition() {
    if (this.nextQuestionTimer) {
      clearTimeout(this.nextQuestionTimer);
      this.nextQuestionTimer = null;
    }
  }

  startNewGame() {
    this.clearPendingTransition();
    this.releaseVoicePromptLock();

    const nextGame = createInitialGameState(QUIZ_QUESTIONS);
    this.setState(
      {
        game: nextGame,
        celebrationNonce: 0,
      },
      () => {
        this.sendGameEvent(createGameStartedEvent(this.state.game), {
          policy: VOICE_EVENT_POLICIES.INTERRUPT,
        });
      }
    );
  }

  moveToNextQuestion({ sendVoiceEvent = true } = {}) {
    this.clearPendingTransition();
    const result = advanceToNextQuestion(this.state.game);
    this.setState({ game: result.game }, () => {
      if (sendVoiceEvent) {
        this.sendGameEvent(result.event);
      }
    });
  }

  handleAnswer(option) {
    const { game } = this.state;
    this.releaseVoicePromptLock();

    if (game.phase === GAME_PHASES.RESULT) {
      this.sendGameEvent(createResultPromptEvent(game), {
        policy: VOICE_EVENT_POLICIES.INTERRUPT,
      });
      return;
    }

    if (game.phase === GAME_PHASES.FEEDBACK) {
      this.sendGameEvent(createInvalidActionEvent(game, INVALID_ACTION_REASONS.FEEDBACK_PENDING), {
        policy: VOICE_EVENT_POLICIES.INTERRUPT,
      });
      return;
    }

    this.clearPendingTransition();
    const result = applyAnswer(game, option);
    this.setState({ game: result.game }, () => {
      if (result.celebrationType) {
        this.triggerCelebration(result.celebrationType);
      }

      this.sendGameEvent(result.event, {
        policy: VOICE_EVENT_POLICIES.INTERRUPT,
      });

      if (result.game.phase === GAME_PHASES.FEEDBACK) {
        this.nextQuestionTimer = setTimeout(() => {
          this.moveToNextQuestion({ sendVoiceEvent: !result.includesNextQuestion });
        }, NEXT_QUESTION_DELAY_MS);
      }
    });
  }

  dispatchAssistantAction(action, options = {}) {
    if (!validateIncomingAction(action)) {
      return;
    }

    if (!options.skipDedupe && !this.rememberAction(action)) {
      return;
    }

    switch (action.type) {
      case ACTION_TYPES.SELECT_OPTION:
        this.handleAnswer((action.option || '').toUpperCase());
        return;
      case ACTION_TYPES.REPEAT_QUESTION:
        if (this.state.game.phase === GAME_PHASES.QUESTION) {
          this.sendGameEvent(createQuestionPromptEvent(this.state.game), {
            policy: VOICE_EVENT_POLICIES.INTERRUPT,
          });
        } else if (this.state.game.phase === GAME_PHASES.RESULT) {
          this.sendGameEvent(createResultPromptEvent(this.state.game), {
            policy: VOICE_EVENT_POLICIES.INTERRUPT,
          });
        } else {
          this.sendGameEvent(
            createInvalidActionEvent(this.state.game, INVALID_ACTION_REASONS.FEEDBACK_PENDING),
            { policy: VOICE_EVENT_POLICIES.INTERRUPT }
          );
        }
        return;
      case ACTION_TYPES.CURRENT_SCORE:
        this.sendGameEvent(createScoreReportEvent(this.state.game), {
          policy: VOICE_EVENT_POLICIES.INTERRUPT,
        });
        return;
      case ACTION_TYPES.RESTART_GAME:
        this.startNewGame();
        return;
      default:
        return;
    }
  }

  render() {
    return (
      <GameScreen
        gameState={this.state.game}
        celebrationType={this.state.celebrationType}
        celebrationNonce={this.state.celebrationNonce}
        isVoicePromptLocked={this.state.isVoicePromptLocked}
        onAnswer={(option) =>
          this.dispatchAssistantAction({ type: ACTION_TYPES.SELECT_OPTION, option })
        }
        onNewGame={() =>
          this.dispatchAssistantAction({ type: ACTION_TYPES.RESTART_GAME })
        }
      />
    );
  }
}
