import React from 'react';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreBoard } from '../components/ScoreBoard';

export const GameScreen = ({
  gameState,
  feedback,
  feedbackType,
  celebrationType,
  celebrationNonce,
  onAnswer,
  onNewGame,
}) => {
  const {
    questions,
    currentQuestionIndex,
    score,
    isWaitingForAnswer,
    isFinished,
    selectedOption,
    revealedCorrectOption,
  } = gameState;

  const currentQuestion = questions[currentQuestionIndex];
  const voiceCommands = [
    'А, Б, В, Г',
    'Вариант А',
    'Повтори вопрос',
    'Мой счёт',
    'Новая игра',
  ];

  return (
    <main className="quiz-layout">
      {celebrationNonce > 0 && (
        <div
          key={`${celebrationType}-${celebrationNonce}`}
          className={`celebration-overlay ${celebrationType}`}
          aria-hidden="true"
        >
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} className="celebration-particle" />
          ))}
        </div>
      )}

      <header className="quiz-header">
        <h1 className="quiz-title">Голосовой Квиз</h1>
        <p className="quiz-subtitle">Отвечайте голосом или нажатием на кнопку</p>
        <div className="quiz-stats">
          <span>Счёт: {score}</span>
          <button className="primary-button" type="button" onClick={onNewGame}>
            Новая игра
          </button>
        </div>
      </header>

      {!isFinished && currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          currentIndex={currentQuestionIndex}
          total={questions.length}
          disabled={!isWaitingForAnswer}
          selectedOption={selectedOption}
          revealedCorrectOption={revealedCorrectOption}
          onAnswer={onAnswer}
        />
      )}

      {isFinished && (
        <ScoreBoard score={score} total={questions.length} onRestart={onNewGame} />
      )}

      {feedback && (
        <div
          className={`toast-message ${feedbackType === 'success' ? 'success' : 'error'}`}
          role="status"
        >
          {feedback}
        </div>
      )}

      <footer className="commands-panel">
        <p className="commands-title">Голосовые команды</p>
        <div className="commands-list">
          {voiceCommands.map((command) => (
            <span key={command} className="command-chip">
              {command}
            </span>
          ))}
        </div>
      </footer>
    </main>
  );
};
