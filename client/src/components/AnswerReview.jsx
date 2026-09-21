import { Check, X } from 'lucide-react';

// Question-by-question breakdown of a graded test attempt
const AnswerReview = ({ review, perspective = 'student' }) => (
  <ol className="review-list">
    {review.map((item, index) => {
      const answered = item.yourAnswer.trim() !== '';
      return (
        <li key={item.questionId ?? index} className={`review-item ${item.isCorrect ? 'is-correct' : 'is-wrong'}`}>
          <div className="review-item-head">
            <span className="review-number">Q{index + 1}</span>
            <p className="review-question">{item.questionText}</p>
            <span className={`badge ${item.isCorrect ? 'badge-success' : 'badge-danger'}`}>
              {item.isCorrect ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
              {item.isCorrect ? `+${item.points}` : `0/${item.points}`} pt{item.points === 1 ? '' : 's'}
            </span>
          </div>
          <dl className="review-answers">
            <div>
              <dt>{perspective === 'teacher' ? 'Student answer' : 'Your answer'}</dt>
              <dd className={answered ? '' : 'text-subtle'}>{answered ? item.yourAnswer : 'No answer'}</dd>
            </div>
            {!item.isCorrect && (
              <div>
                <dt>Correct answer</dt>
                <dd className="text-success">
                  {item.acceptedAnswers?.length > 1 ? item.acceptedAnswers.join(' / ') : item.correctAnswer}
                </dd>
              </div>
            )}
          </dl>
        </li>
      );
    })}
  </ol>
);

export default AnswerReview;
