import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Heart, X, XCircle } from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, LoadingScreen, ProgressBar, Spinner } from '../components/ui';
import { courseAPI, getErrorMessage, userAPI } from '../services/api';

const Lesson = () => {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { correct, correctAnswer } once checked
  const [checking, setChecking] = useState(false);
  const [actionError, setActionError] = useState('');

  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [hearts, setHearts] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([courseAPI.getLessonQuestions(lessonId), userAPI.getDashboard()])
      .then(([lessonRes, dashboardRes]) => {
        if (cancelled) return;
        setLesson(lessonRes.data);
        setHearts(dashboardRes.data.stats.hearts);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Failed to load this lesson.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const questions = lesson?.questions ?? [];
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const outOfHearts = feedback && !feedback.correct && hearts === 0;

  const submitLesson = useCallback(
    async (answers, failed) => {
      setSubmitting(true);
      try {
        const res = await userAPI.submitLesson(lessonId, answers);
        navigate('/results', {
          replace: true,
          state: { lessonTitle: lesson.title, results: res.data, wasFailed: failed || !res.data.success },
        });
      } catch (err) {
        setActionError(getErrorMessage(err, 'We could not save your progress. Please try again.'));
        setSubmitting(false);
      }
    },
    [lessonId, lesson, navigate]
  );

  const handleCheck = useCallback(async () => {
    if (!answer.trim() || checking || feedback) return;
    setChecking(true);
    setActionError('');
    try {
      const res = await courseAPI.checkAnswer(lessonId, question.id, answer);
      setFeedback(res.data);
      setSubmittedAnswers((prev) => [...prev, { questionId: question.id, answer }]);
      if (!res.data.correct) {
        setHearts((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not check your answer.'));
    } finally {
      setChecking(false);
    }
  }, [answer, checking, feedback, lessonId, question]);

  const handleContinue = useCallback(() => {
    if (submitting) return;
    if (outOfHearts) {
      submitLesson(submittedAnswers, true);
    } else if (isLast) {
      submitLesson(submittedAnswers, false);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAnswer('');
      setFeedback(null);
    }
  }, [submitting, outOfHearts, isLast, submitLesson, submittedAnswers]);

  // Keyboard: 1-9 picks an option, Enter checks / continues
  useEffect(() => {
    if (!question || confirmQuit) return undefined;
    const onKeyDown = (event) => {
      const typing = event.target.tagName === 'INPUT';
      if (event.key === 'Enter') {
        event.preventDefault();
        if (feedback) handleContinue();
        else handleCheck();
      } else if (!typing && !feedback && question.type === 'multiple-choice') {
        const option = question.options?.[Number(event.key) - 1];
        if (option) setAnswer(option);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [question, feedback, confirmQuit, handleCheck, handleContinue]);

  if (loading) return <LoadingScreen message="Loading lesson…" />;

  if (error || questions.length === 0) {
    return (
      <div className="focus-page">
        <div className="focus-body">
          {error ? (
            <ErrorState message={error} />
          ) : (
            <EmptyState title="No questions yet">This lesson doesn't have any questions yet.</EmptyState>
          )}
          <div className="text-center">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + (feedback ? 1 : 0)) / questions.length) * 100;

  const optionState = (option) => {
    if (!feedback) return answer === option ? 'selected' : '';
    if (option === feedback.correctAnswer) return 'correct';
    if (option === answer) return 'wrong';
    return 'dimmed';
  };

  return (
    <div className="focus-page">
      <header className="focus-topbar">
        <button type="button" className="icon-btn" onClick={() => setConfirmQuit(true)} aria-label="Quit lesson">
          <X size={20} />
        </button>
        <ProgressBar value={progress} label="Lesson progress" />
        <span className="hearts-pill" aria-label={`${hearts} hearts left`}>
          <Heart size={16} aria-hidden="true" /> {hearts}
        </span>
      </header>

      <main className="focus-body">
        <div className="question-card">
          <span className="eyebrow">
            {lesson.title} · Question {currentIndex + 1} of {questions.length}
          </span>
          <h1 className="question-text">{question.questionText}</h1>

          {question.type === 'multiple-choice' ? (
            <div className="choice-list" role="radiogroup" aria-label="Answer options">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={answer === option}
                  className={`choice ${optionState(option)}`}
                  onClick={() => !feedback && setAnswer(option)}
                  disabled={Boolean(feedback)}
                >
                  <span className="choice-key">{index + 1}</span>
                  <span className="choice-label">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              className={`input input-lg ${feedback ? (feedback.correct ? 'is-correct' : 'is-wrong') : ''}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer"
              disabled={Boolean(feedback)}
              aria-label="Your answer"
              autoFocus
            />
          )}
        </div>
      </main>

      <footer className={`focus-footer ${feedback ? (feedback.correct ? 'is-correct' : 'is-wrong') : ''}`}>
        <div className="focus-footer-inner">
          <div className="feedback" aria-live="polite">
            {actionError ? (
              <p className="text-danger">{actionError}</p>
            ) : feedback ? (
              feedback.correct ? (
                <>
                  <CheckCircle2 size={28} aria-hidden="true" />
                  <div>
                    <strong>Correct!</strong>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={28} aria-hidden="true" />
                  <div>
                    <strong>{outOfHearts ? 'Out of hearts' : 'Not quite'}</strong>
                    <p>
                      Correct answer: <b>{feedback.correctAnswer}</b>
                    </p>
                  </div>
                </>
              )
            ) : (
              <p className="text-muted text-sm">Tip: press Enter to check{question.type === 'multiple-choice' ? ', or 1–4 to pick' : ''}.</p>
            )}
          </div>

          {feedback ? (
            <button type="button" className="btn btn-primary btn-lg" onClick={handleContinue} disabled={submitting}>
              {submitting && <Spinner size="sm" />}
              {submitting ? 'Saving…' : outOfHearts ? 'See results' : isLast ? 'Finish lesson' : 'Continue'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg" onClick={handleCheck} disabled={!answer.trim() || checking}>
              {checking && <Spinner size="sm" />}
              Check
            </button>
          )}
        </div>
      </footer>

      <ConfirmDialog
        open={confirmQuit}
        title="Quit this lesson?"
        confirmLabel="Quit lesson"
        cancelLabel="Keep going"
        tone="danger"
        onConfirm={() => navigate('/')}
        onCancel={() => setConfirmQuit(false)}
      >
        <p>Your answers in this lesson won't be saved.</p>
      </ConfirmDialog>
    </div>
  );
};

export default Lesson;
