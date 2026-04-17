import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

import './App.css';
import { GameScreen } from './pages/GameScreen';
import { QUIZ_QUESTIONS } from './data/questions';

const STORAGE_KEY = 'voice_quiz_game_state_v1';
const FEEDBACK_DURATION = 1800;

const OPTION_LABELS = {
  A: 'А',
  B: 'Б',
  V: 'В',
  G: 'Г',
};

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
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

const createInitialGameState = () => ({
  questions: QUIZ_QUESTIONS,
  currentQuestionIndex: 0,
  score: 0,
  isWaitingForAnswer: true,
  isFinished: false,
});

const normalizeRestoredState = (restored) => {
  if (!restored) {
    return null;
  }

  const total = QUIZ_QUESTIONS.length;
  const safeIndex = Math.min(
    Math.max(Number(restored.currentQuestionIndex) || 0, 0),
    Math.max(total - 1, 0)
  );

  const score = Math.min(Math.max(Number(restored.score) || 0, 0), total);
  const isFinished =
    Boolean(restored.isFinished) ||
    (safeIndex >= total - 1 && !restored.isWaitingForAnswer);

  return {
    ...createInitialGameState(),
    ...restored,
    questions: QUIZ_QUESTIONS,
    currentQuestionIndex: safeIndex,
    score,
    isFinished,
    isWaitingForAnswer: isFinished ? false : true,
  };
};

const normalizeText = (text) =>
  (text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const detectOption = (text) => {
  const normalized = ` ${normalizeText(text)} `;

  if (/\b(а|вариант а|ответ а)\b/.test(normalized)) return 'A';
  if (/\b(б|вариант б|ответ б)\b/.test(normalized)) return 'B';
  if (/\b(в|вариант в|ответ в)\b/.test(normalized)) return 'V';
  if (/\b(г|вариант г|ответ г)\b/.test(normalized)) return 'G';

  return null;
};

const parseVoiceCommand = (rawText) => {
  const text = normalizeText(rawText);

  if (!text) {
    return { type: 'unknown' };
  }

  const option = detectOption(text);
  if (option) {
    return { type: 'answer', option };
  }

  if (text.includes('повтори вопрос')) {
    return { type: 'repeat_question' };
  }

  if (text.includes('мой счет')) {
    return { type: 'current_score' };
  }

  if (
    text.includes('начать заново') ||
    text.includes('новая игра') ||
    text.includes('сыграть еще')
  ) {
    return { type: 'restart' };
  }

  return { type: 'unknown' };
};

const getCommandText = (event) => {
  if (!event) {
    return '';
  }

  if (typeof event === 'string') {
    return event;
  }

  const source = event.command || event;
  return source?.raw_text || source?.phrase || source?.text || source?.command || '';
};

export class App extends React.Component {
  constructor(props) {
    super(props);

    const persistedState = this.restoreState();

    this.state = {
      game: persistedState || createInitialGameState(),
      feedback: '',
      feedbackType: 'success',
    };

    this.feedbackTimer = null;
    this.nextQuestionTimer = null;
    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on('data', (event) => {
      if (event?.type === 'character' || event?.type === 'insets') {
        return;
      }

      const { action } = event;
      this.dispatchAssistantAction(action);
    });

    this.assistant.on('command', (event) => {
      this.handleVoiceEvent(event);
    });

    this.assistant.on('start', () => {
      this.say(
        'Добро пожаловать в Голосовой Квиз. Я задам 7 вопросов. Отвечайте: А, Б, В или Г.'
      );
      this.repeatCurrentQuestion();
    });
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.game !== this.state.game) {
      this.saveState();
    }
  }

  componentWillUnmount() {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }

    if (this.nextQuestionTimer) {
      clearTimeout(this.nextQuestionTimer);
    }
  }

  getStateForAssistant() {
    const { game } = this.state;
    const currentQuestion = game.questions[game.currentQuestionIndex];

    return {
      quiz: {
        current_question_index: game.currentQuestionIndex,
        total_questions: game.questions.length,
        score: game.score,
        is_waiting_for_answer: game.isWaitingForAnswer,
        is_finished: game.isFinished,
        question: currentQuestion
          ? {
              text: currentQuestion.question,
              options: currentQuestion.options,
            }
          : null,
      },
    };
  }

  restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return normalizeRestoredState(parsed);
    } catch (error) {
      return null;
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.game));
    } catch (error) {
      console.error('Failed to save game state', error);
    }
  }

  say(text) {
    const data = {
      action: {
        action_id: 'voice_quiz_feedback',
        parameters: {
          value: text,
        },
      },
    };

    const unsubscribe = this.assistant.sendData(data, () => {
      unsubscribe();
    });
  }

  setFeedback(message, type = 'success') {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }

    this.setState({ feedback: message, feedbackType: type });

    this.feedbackTimer = setTimeout(() => {
      this.setState({ feedback: '' });
    }, FEEDBACK_DURATION);
  }

  dispatchAssistantAction(action) {
    if (!action || !action.type) {
      return;
    }

    switch (action.type) {
      case 'select_option': {
        this.answerQuestion((action.option || '').toUpperCase());
        break;
      }
      case 'repeat_question': {
        this.repeatCurrentQuestion();
        break;
      }
      case 'current_score': {
        this.sayCurrentScore();
        break;
      }
      case 'restart_game': {
        this.startNewGame();
        break;
      }
      default:
        break;
    }
  }

  handleVoiceEvent(event) {
    const text = getCommandText(event);
    const command = parseVoiceCommand(text);

    switch (command.type) {
      case 'answer': {
        this.answerQuestion(command.option);
        break;
      }
      case 'repeat_question': {
        this.repeatCurrentQuestion();
        break;
      }
      case 'current_score': {
        this.sayCurrentScore();
        break;
      }
      case 'restart': {
        this.startNewGame();
        break;
      }
      default:
        break;
    }
  }

  sayCurrentScore() {
    const { score, currentQuestionIndex, isWaitingForAnswer, isFinished } =
      this.state.game;
    const answeredCount = isFinished
      ? QUIZ_QUESTIONS.length
      : Math.min(
          currentQuestionIndex + (isWaitingForAnswer ? 0 : 1),
          QUIZ_QUESTIONS.length
        );
    this.say(`Ваш текущий счёт: ${score} правильных ответов из ${answeredCount}.`);
  }

  repeatCurrentQuestion() {
    const { game } = this.state;
    if (game.isFinished) {
      this.say(
        `Игра завершена. Ваш результат: ${game.score} из ${game.questions.length}. Скажите: сыграть еще.`
      );
      return;
    }

    const question = game.questions[game.currentQuestionIndex];
    if (!question) {
      return;
    }

    this.say(
      `Вопрос ${game.currentQuestionIndex + 1}. ${question.question} ` +
        `Вариант А: ${question.options.A}. ` +
        `Вариант Б: ${question.options.B}. ` +
        `Вариант В: ${question.options.V}. ` +
        `Вариант Г: ${question.options.G}.`
    );
  }

  startNewGame() {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }

    if (this.nextQuestionTimer) {
      clearTimeout(this.nextQuestionTimer);
    }

    this.setState(
      {
        game: createInitialGameState(),
        feedback: '',
        feedbackType: 'success',
      },
      () => {
        this.say('Новая игра началась.');
        this.repeatCurrentQuestion();
      }
    );
  }

  answerQuestion(option) {
    this.setState(
      (prevState) => {
        const { game } = prevState;

        if (game.isFinished || !game.isWaitingForAnswer) {
          return null;
        }

        const question = game.questions[game.currentQuestionIndex];
        if (!question || !OPTION_LABELS[option]) {
          return null;
        }

        const isCorrect = question.correctOption === option;
        const nextScore = isCorrect ? game.score + 1 : game.score;
        const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

        const feedback = isCorrect
          ? 'Верно!'
          : `Ошибка. Правильный ответ: ${OPTION_LABELS[question.correctOption]} - ${question.options[question.correctOption]}.`;

        return {
          game: {
            ...game,
            score: nextScore,
            isWaitingForAnswer: false,
            isFinished: isLastQuestion,
          },
          feedback,
          feedbackType: isCorrect ? 'success' : 'error',
        };
      },
      () => {
        const { feedback, feedbackType, game } = this.state;
        if (!feedback) {
          return;
        }

        this.say(feedback);
        this.setFeedback(feedback, feedbackType);

        if (game.isFinished) {
          this.say(`Вы ответили правильно на ${game.score} из ${game.questions.length} вопросов.`);
          return;
        }

        this.nextQuestionTimer = setTimeout(() => {
          this.moveToNextQuestion();
        }, FEEDBACK_DURATION);
      }
    );
  }

  moveToNextQuestion() {
    this.setState(
      (prevState) => {
        const { game } = prevState;
        if (game.isFinished) {
          return null;
        }

        const nextQuestionIndex = game.currentQuestionIndex + 1;
        if (nextQuestionIndex >= game.questions.length) {
          return {
            game: {
              ...game,
              isFinished: true,
              isWaitingForAnswer: false,
            },
          };
        }

        return {
          game: {
            ...game,
            currentQuestionIndex: nextQuestionIndex,
            isWaitingForAnswer: true,
          },
        };
      },
      () => {
        this.repeatCurrentQuestion();
      }
    );
  }

  render() {
    return (
      <GameScreen
        gameState={this.state.game}
        feedback={this.state.feedback}
        feedbackType={this.state.feedbackType}
        onAnswer={(option) => this.answerQuestion(option)}
        onNewGame={() => this.startNewGame()}
      />
    );
  }
}
