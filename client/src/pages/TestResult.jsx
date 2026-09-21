import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import AnswerReview from '../components/AnswerReview';
import { ErrorState, LoadingScreen, ScoreRing } from '../components/ui';
import { getErrorMessage, testAPI } from '../services/api';
import { formatDateTime } from '../utils/format';

const headline = (score) => {
  if (score === 100) return 'Perfect score!';
  if (score >= 80) return 'Great job!';
  if (score >= 50) return 'Good effort';
  return 'Keep practising';
};

const TestResult = () => {
  const { id: testId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result ?? null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState('');

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await testAPI.result(testId);
      setResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your result.'));
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (!result) fetchResult();
  }, [result, fetchResult]);

  if (loading) return <LoadingScreen message="Loading your result…" />;

  if (error) {
    return (
      <div className="result-page">
        <div className="card result-card">
          <ErrorState message={error} onRetry={fetchResult} />
          <Link to="/tests" className="btn btn-secondary btn-block">Back to tests</Link>
        </div>
      </div>
    );
  }

  const justSubmitted = location.state?.justSubmitted;

  return (
    <div className="result-page">
      <div className="card result-card result-card-wide">
        <div className="result-hero">
          <span className="eyebrow">{justSubmitted ? 'Test submitted' : `Submitted ${formatDateTime(result.submittedAt)}`}</span>
          <h1>{result.testTitle}</h1>
          <ScoreRing score={result.score} />
          <h2>{headline(result.score)}</h2>
          <p className="text-muted">
            You earned <strong>{result.pointsEarned}</strong> of <strong>{result.pointsPossible}</strong> points and answered{' '}
            <strong>{result.correctCount}</strong> of <strong>{result.totalQuestions}</strong> questions correctly.
          </p>
        </div>

        <section>
          <h2 className="section-title">Your answers</h2>
          <AnswerReview review={result.review} />
        </section>

        <div className="button-row">
          <Link to="/" className="btn btn-secondary">Dashboard</Link>
          <Link to="/tests" className="btn btn-primary">Back to tests</Link>
        </div>
      </div>
    </div>
  );
};

export default TestResult;
