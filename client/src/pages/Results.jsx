import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Flame, Heart, HeartCrack, Star, Target, Trophy } from 'lucide-react';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lessonTitle, results, wasFailed } = location.state || {};

  // Reached directly (e.g. page refresh) — nothing to show
  if (!results) {
    return <Navigate to="/" replace />;
  }

  const { score, correctCount, totalQuestions, xpGained, heartsLeft, streakCount } = results;

  const metrics = [
    { icon: Target, value: `${score}%`, label: 'Accuracy', tone: 'brand' },
    { icon: Star, value: `+${xpGained}`, label: 'XP gained', tone: 'gold' },
    { icon: Flame, value: streakCount, label: 'Day streak', tone: 'gold' },
    { icon: Heart, value: `${heartsLeft}/5`, label: 'Hearts left', tone: 'heart' },
  ];

  return (
    <div className="result-page">
      <div className="card result-card">
        <div className={`result-hero ${wasFailed ? 'is-failed' : 'is-success'}`}>
          <span className="result-hero-icon" aria-hidden="true">
            {wasFailed ? <HeartCrack size={36} /> : <Trophy size={36} />}
          </span>
          <h1>{wasFailed ? 'Out of hearts' : 'Lesson complete!'}</h1>
          <p className="text-muted">
            {wasFailed
              ? `You ran out of hearts during "${lessonTitle}". Practice makes perfect — try again!`
              : `Great work finishing "${lessonTitle}".`}
          </p>
        </div>

        <div className="metric-grid">
          {metrics.map(({ icon: Icon, value, label, tone }) => (
            <div key={label} className={`stat-tile tone-${tone}`}>
              <Icon size={20} aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-muted">
          You answered <strong>{correctCount}</strong> of <strong>{totalQuestions}</strong> questions correctly.
        </p>

        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/')}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

export default Results;
