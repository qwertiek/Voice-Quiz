import React from 'react';

const OPTION_LABELS = {
  A: 'А',
  B: 'Б',
  V: 'В',
  G: 'Г',
};

export const QuestionCard = ({
  question,
  currentIndex,
  total,
  disabled,
  onAnswer,
}) => {
  const optionOrder = ['A', 'B', 'V', 'G'];

  return (
    <section className="question-card" aria-live="polite">
      <div className="question-meta">
        <span>
          Вопрос {currentIndex + 1} из {total}
        </span>
      </div>

      <h2 className="question-title">{question.question}</h2>

      <div className="answers-grid">
        {optionOrder.map((optionKey) => (
          <button
            key={optionKey}
            className="answer-button"
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(optionKey)}
          >
            <span className="answer-letter">{OPTION_LABELS[optionKey]}</span>
            <span className="answer-text">{question.options[optionKey]}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
