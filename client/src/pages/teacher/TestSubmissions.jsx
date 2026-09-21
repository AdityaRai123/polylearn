import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, RotateCcw, Users } from 'lucide-react';
import AppShell from '../../components/AppShell';
import AnswerReview from '../../components/AnswerReview';
import { Alert, ConfirmDialog, EmptyState, ErrorState, LoadingBlock, LoadingScreen, ProgressBar } from '../../components/ui';
import { getErrorMessage, teacherAPI } from '../../services/api';
import { formatDateTime, scoreTone } from '../../utils/format';

const TestSubmissions = () => {
  const { id: testId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const [openAttemptId, setOpenAttemptId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [reviewError, setReviewError] = useState('');
  const [attemptToReset, setAttemptToReset] = useState(null);
  const [resetting, setResetting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherAPI.listAttempts(testId);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load submissions.'));
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const toggleReview = async (attemptId) => {
    if (openAttemptId === attemptId) {
      setOpenAttemptId(null);
      return;
    }
    setOpenAttemptId(attemptId);
    setReviewError('');
    if (reviews[attemptId]) return;
    try {
      const res = await teacherAPI.getAttempt(testId, attemptId);
      setReviews((prev) => ({ ...prev, [attemptId]: res.data.review }));
    } catch (err) {
      setReviewError(getErrorMessage(err, 'Failed to load this submission.'));
    }
  };

  const resetAttempt = async () => {
    setResetting(true);
    try {
      await teacherAPI.resetAttempt(testId, attemptToReset.id);
      setNotice({ tone: 'success', text: `${attemptToReset.student?.name ?? 'The student'} can now retake the test.` });
      setAttemptToReset(null);
      setOpenAttemptId(null);
      await fetchSubmissions();
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err) });
      setAttemptToReset(null);
    } finally {
      setResetting(false);
    }
  };

  if (loading && !data) {
    return (
      <AppShell>
        <LoadingScreen message="Loading submissions…" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState message={error} onRetry={fetchSubmissions} />
      </AppShell>
    );
  }

  const { test, summary, attempts } = data;
  const formatScore = (value) => (value === null ? '—' : `${value}%`);

  return (
    <AppShell>
      <div className="page">
        <Link to="/teacher" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" /> My tests
        </Link>

        <header className="page-header">
          <div>
            <div className="teacher-test-title">
              <h1>{test.title}</h1>
              <span className={`badge ${test.isPublished ? 'badge-success' : 'badge-muted'}`}>{test.isPublished ? 'Published' : 'Draft'}</span>
            </div>
            <p className="text-muted">
              {test.questionCount} questions · {test.totalPoints} points
            </p>
          </div>
          <Link to={`/teacher/tests/${test.id}/edit`} className="btn btn-secondary">
            <Pencil size={16} aria-hidden="true" /> Edit test
          </Link>
        </header>

        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

        <div className="metric-grid">
          <div className="stat-tile">
            <strong>{summary.attemptCount}</strong>
            <span>Submissions</span>
          </div>
          <div className="stat-tile">
            <strong>{formatScore(summary.averageScore)}</strong>
            <span>Average</span>
          </div>
          <div className="stat-tile">
            <strong>{formatScore(summary.highestScore)}</strong>
            <span>Highest</span>
          </div>
          <div className="stat-tile">
            <strong>{formatScore(summary.lowestScore)}</strong>
            <span>Lowest</span>
          </div>
        </div>

        {attempts.length === 0 ? (
          <EmptyState icon={Users} title="No submissions yet">
            {test.isPublished
              ? 'Scores will appear here as soon as students submit the test.'
              : 'This test is a draft. Publish it from My tests so students can take it.'}
          </EmptyState>
        ) : (
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Score</th>
                  <th scope="col" className="hide-sm">Points</th>
                  <th scope="col" className="hide-sm">Submitted</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const isOpen = openAttemptId === attempt.id;
                  return (
                    <Fragment key={attempt.id}>
                      <tr className={isOpen ? 'is-open' : ''}>
                        <td>
                          <div className="student-cell">
                            <span className="avatar avatar-sm" aria-hidden="true">
                              {attempt.student?.name?.charAt(0).toUpperCase() ?? '?'}
                            </span>
                            <div>
                              <strong>{attempt.student?.name ?? 'Deleted account'}</strong>
                              <small className="text-subtle">{attempt.student?.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="score-cell">
                            <strong className={`text-${scoreTone(attempt.score)}`}>{attempt.score}%</strong>
                            <ProgressBar value={attempt.score} tone={scoreTone(attempt.score)} label={`Score ${attempt.score}%`} />
                          </div>
                        </td>
                        <td className="hide-sm">
                          {attempt.pointsEarned}/{attempt.pointsPossible}
                        </td>
                        <td className="hide-sm nowrap">{formatDateTime(attempt.submittedAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleReview(attempt.id)} aria-expanded={isOpen} aria-label="Show answers">
                              {isOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                              <span className="hide-sm">Answers</span>
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setAttemptToReset(attempt)}
                              aria-label={`Allow ${attempt.student?.name ?? 'student'} to retake`}
                              title="Allow retake"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="review-row">
                          <td colSpan={5}>
                            {reviewError ? (
                              <Alert tone="error">{reviewError}</Alert>
                            ) : reviews[attempt.id] ? (
                              <AnswerReview review={reviews[attempt.id]} perspective="teacher" />
                            ) : (
                              <LoadingBlock message="Loading answers…" />
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(attemptToReset)}
        title="Allow a retake?"
        confirmLabel="Delete submission"
        tone="danger"
        busy={resetting}
        onConfirm={resetAttempt}
        onCancel={() => setAttemptToReset(null)}
      >
        <p>
          This deletes <strong>{attemptToReset?.student?.name}</strong>'s submission ({attemptToReset?.score}%) so they can take the test
          again. Their current answers will be lost.
        </p>
      </ConfirmDialog>
    </AppShell>
  );
};

export default TestSubmissions;
