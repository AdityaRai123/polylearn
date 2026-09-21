import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ClipboardList, X } from 'lucide-react';
import { Alert, ConfirmDialog, ErrorState, LoadingScreen, ProgressBar, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, testAPI } from '../services/api';

// In-progress answers survive a page refresh (per user and test)
const draftKey = (userId, testId) => `polylearn:test-draft:${userId}:${testId}`;

const loadDraft = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
};

const TakeTest = () => {
  const { id: testId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const storageKey = draftKey(user?.id, testId);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stage, setStage] = useState('intro'); // intro -> questions -> review
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => loadDraft(storageKey));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const fetchTest = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await testAPI.get(testId);
      setTest(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load this test.'));
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // Storage unavailable (private mode) — answers still live in memory
    }
  }, [answers, storageKey]);

  const questions = useMemo(() => test?.questions ?? [], [test]);
  const answeredCount = questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length;
  const unansweredCount = questions.length - answeredCount;

  const setAnswer = (questionId, value) => setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? '' }));
      const res = await testAPI.submit(testId, payload);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      navigate(`/tests/${testId}/result`, { replace: true, state: { result: res.data, justSubmitted: true } });
    } catch (err) {
      if (err.response?.status === 409) {
        navigate(`/tests/${testId}/result`, { replace: true });
        return;
      }
      setSubmitError(getErrorMessage(err, 'We could not submit your test. Please try again.'));
      setConfirmSubmit(false);
      setSubmitting(false);
    }
  };

  const requestSubmit = () => {
    if (unansweredCount > 0) setConfirmSubmit(true);
    else handleSubmit();
  };

  if (loading) return <LoadingScreen message="Loading test…" />;

  if (error) {
    return (
      <div className="focus-page">
        <div className="focus-body">
          <ErrorState message={error} onRetry={fetchTest} />
          <div className="text-center">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tests')}>
              Back to tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already taken — show the result instead
  if (test.attemptId) {
    return <Navigate to={`/tests/${testId}/result`} replace />;
  }

  if (stage === 'intro') {
    return (
      <div className="result-page">
        <div className="card result-card">
          <div className="result-hero">
            <span className="result-hero-icon tone-brand" aria-hidden="true">
              <ClipboardList size={32} />
            </span>
            <span className="eyebrow">Test by {test.teacherName}</span>
            <h1>{test.title}</h1>
            {test.description && <p className="text-muted pre-wrap">{test.description}</p>}
          </div>
          <div className="metric-grid metric-grid-3">
            <div className="stat-tile">
              <strong>{questions.length}</strong>
              <span>Questions</span>
            </div>
            <div className="stat-tile">
              <strong>{test.totalPoints}</strong>
              <span>Points</span>
            </div>
            <div className="stat-tile">
              <strong>1</strong>
              <span>Attempt</span>
            </div>
          </div>
          <Alert tone="info">You can move between questions freely. Your score appears as soon as you submit.</Alert>
          <div className="button-row">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tests')}>
              Not now
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setStage('questions')} disabled={questions.length === 0}>
              {answeredCount > 0 ? 'Resume test' : 'Start test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="focus-page">
      <header className="focus-topbar">
        <button type="button" className="icon-btn" onClick={() => setConfirmQuit(true)} aria-label="Leave test">
          <X size={20} />
        </button>
        <ProgressBar value={(answeredCount / questions.length) * 100} label="Questions answered" />
        <span className="text-sm text-muted nowrap">
          {answeredCount}/{questions.length} answered
        </span>
      </header>

      <main className="focus-body">
        {stage === 'questions' ? (
          <>
            <nav className="question-dots" aria-label="Jump to question">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  type="button"
                  className={`dot ${index === currentIndex ? 'current' : ''} ${(answers[q.id] ?? '').trim() ? 'answered' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Question ${index + 1}`}
                  aria-current={index === currentIndex ? 'step' : undefined}
                >
                  {index + 1}
                </button>
              ))}
            </nav>

            <div className="question-card">
              <span className="eyebrow">
                Question {currentIndex + 1} of {questions.length} · {question.points} pt{question.points === 1 ? '' : 's'}
              </span>
              <h1 className="question-text pre-wrap">{question.questionText}</h1>

              {question.type === 'multiple-choice' ? (
                <div className="choice-list" role="radiogroup" aria-label="Answer options">
                  {question.options.map((option, index) => {
                    const selected = answers[question.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`choice ${selected ? 'selected' : ''}`}
                        onClick={() => setAnswer(question.id, option)}
                      >
                        <span className="choice-key">{String.fromCharCode(65 + index)}</span>
                        <span className="choice-label">{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  key={question.id}
                  type="text"
                  className="input input-lg"
                  value={answers[question.id] ?? ''}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  placeholder="Type your answer"
                  aria-label="Your answer"
                  maxLength={500}
                  autoFocus
                />
              )}
            </div>
          </>
        ) : (
          <div className="question-card">
            <h1 className="question-text">Review your answers</h1>
            <p className="text-muted">
              {unansweredCount === 0
                ? 'Every question has an answer. Submit when you are ready.'
                : `${unansweredCount} question${unansweredCount === 1 ? ' is' : 's are'} still unanswered.`}
            </p>
            <ol className="review-summary">
              {questions.map((q, index) => {
                const value = (answers[q.id] ?? '').trim();
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(index);
                        setStage('questions');
                      }}
                    >
                      <span className="review-number">Q{index + 1}</span>
                      <span className="review-summary-question">{q.questionText}</span>
                      <span className={value ? 'review-summary-answer' : 'badge badge-warning'}>{value || 'Unanswered'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {submitError && <Alert tone="error">{submitError}</Alert>}
          </div>
        )}
      </main>

      <footer className="focus-footer">
        <div className="focus-footer-inner">
          {stage === 'questions' ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentIndex((i) => i - 1)}
                disabled={currentIndex === 0}
              >
                <ArrowLeft size={16} aria-hidden="true" /> Previous
              </button>
              {isLast ? (
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setStage('review')}>
                  Review answers
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setCurrentIndex((i) => i + 1)}>
                  Next <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setStage('questions')} disabled={submitting}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to questions
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={requestSubmit} disabled={submitting}>
                {submitting && <Spinner size="sm" />}
                {submitting ? 'Submitting…' : 'Submit test'}
              </button>
            </>
          )}
        </div>
      </footer>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit with unanswered questions?"
        confirmLabel="Submit anyway"
        cancelLabel="Keep working"
        busy={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSubmit(false)}
      >
        <p>
          {unansweredCount} question{unansweredCount === 1 ? '' : 's'} will be marked wrong. You can't change your answers after
          submitting.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmQuit}
        title="Leave this test?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => navigate('/tests')}
        onCancel={() => setConfirmQuit(false)}
      >
        <p>Your answers are saved on this device, so you can come back and finish later. The test is only graded once you submit.</p>
      </ConfirmDialog>
    </div>
  );
};

export default TakeTest;
