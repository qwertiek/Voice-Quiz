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
  selectedOption,
  revealedCorrectOption,
  onAnswer,
}) => {
  const optionOrder = ['A', 'B', 'V', 'G'];

  const getAnswerState = (optionKey) => {
    if (!selectedOption || !revealedCorrectOption) {
      return '';
    }

    if (optionKey === selectedOption && optionKey === revealedCorrectOption) {
      return 'is-correct';
    }

    if (optionKey === selectedOption && optionKey !== revealedCorrectOption) {
      return 'is-wrong';
    }

    if (selectedOption !== revealedCorrectOption && optionKey === revealedCorrectOption) {
      return 'is-revealed';
    }

    return '';
  };

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
            className={`answer-button ${getAnswerState(optionKey)}`.trim()}
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
