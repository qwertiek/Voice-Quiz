import React from 'react';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreBoard } from '../components/ScoreBoard';

export const GameScreen = ({
  gameState,
  feedback,
  feedbackType,
  onAnswer,
  onNewGame,
}) => {
  const { questions, currentQuestionIndex, score, isWaitingForAnswer, isFinished } =
    gameState;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="quiz-layout">
      <header className="quiz-header">
        <h1 className="quiz-title">Голосовой Квиз</h1>
        <p className="quiz-subtitle">Отвечайте голосом или нажатием на кнопки</p>
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
    </main>
  );
};
