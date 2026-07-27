import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const { lessonTitle, results, wasFailed } = state;

  // Fallback in case someone directly navigates to /results
  if (!results) {
    return (
      <div className="results-fallback-container">
        <h2>No lesson records found.</h2>
        <button onClick={() => navigate('/')} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  const { score, correctCount, totalQuestions, xpGained, heartsLeft, streakCount } = results;

  return (
    <div className={`results-page-container ${wasFailed ? 'failed-theme' : 'success-theme'}`}>
      <div className="results-card">
        {wasFailed ? (
          <div className="results-illustration failed">
            <span className="emoji-illustration">💔</span>
            <h1>No Hearts Left!</h1>
            <p>You ran out of lives during the lesson "{lessonTitle}". Keep practicing and try again!</p>
          </div>
        ) : (
          <div className="results-illustration success">
            <span className="emoji-illustration">🏆</span>
            <h1>Lesson Completed!</h1>
            <p>Fantastic job! You've successfully finished the lesson "{lessonTitle}".</p>
          </div>
        )}

        <div className="results-stats-row">
          <div className="result-metric-card accuracy">
            <span className="metric-icon">🎯</span>
            <span className="metric-value">{score}%</span>
            <span className="metric-label">Accuracy</span>
          </div>

          <div className="result-metric-card xp-earned">
            <span className="metric-icon">⭐</span>
            <span className="metric-value">+{xpGained}</span>
            <span className="metric-label">XP Gained</span>
          </div>

          <div className="result-metric-card streak-updated">
            <span className="metric-icon">🔥</span>
            <span className="metric-value">{streakCount}</span>
            <span className="metric-label">Day Streak</span>
          </div>

          <div className="result-metric-card hearts-remaining">
            <span className="metric-icon">❤️</span>
            <span className="metric-value">{heartsLeft} / 5</span>
            <span className="metric-label">Hearts Left</span>
          </div>
        </div>

        <div className="results-summary-text">
          <p>You answered <strong>{correctCount}</strong> out of <strong>{totalQuestions}</strong> questions correctly.</p>
        </div>

        <div className="results-actions">
          <button onClick={() => navigate('/')} className="btn-primary btn-results-finish">
            {wasFailed ? 'Back to Dashboard' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
