import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, CircleDot, Copy, ListChecks, Plus, TextCursorInput, Trash2, X } from 'lucide-react';
import AppShell from '../../components/AppShell';
import { Alert, ConfirmDialog, ErrorState, LoadingScreen, Spinner } from '../../components/ui';
import { getErrorMessage, teacherAPI } from '../../services/api';

const MAX_OPTIONS = 6;
const MAX_ACCEPTED = 10;

let keyCounter = 0;
const newKey = () => `q${++keyCounter}`;

const blankQuestion = (type = 'multiple-choice') => ({
  key: newKey(),
  type,
  questionText: '',
  points: 1,
  // Both answer shapes are kept so switching the type doesn't lose what was typed
  options: ['', '', '', ''],
  correctIndex: 0,
  acceptedAnswers: [''],
});

const fromServerQuestion = (q) => ({
  ...blankQuestion(q.type),
  questionText: q.questionText,
  points: q.points,
  ...(q.type === 'multiple-choice'
    ? { options: q.options, correctIndex: Math.max(0, q.options.indexOf(q.correctAnswers[0])) }
    : { acceptedAnswers: q.correctAnswers }),
});

const toPayloadQuestion = (q) =>
  q.type === 'multiple-choice'
    ? {
        type: q.type,
        questionText: q.questionText.trim(),
        points: Number(q.points),
        options: q.options.map((o) => o.trim()),
        correctAnswer: (q.options[q.correctIndex] ?? '').trim(),
      }
    : {
        type: q.type,
        questionText: q.questionText.trim(),
        points: Number(q.points),
        acceptedAnswers: q.acceptedAnswers.map((a) => a.trim()).filter(Boolean),
      };

// Used to detect unsaved changes (question keys are client-only)
const snapshotOf = (form) => JSON.stringify({ ...form, questions: form.questions.map(({ key: _key, ...q }) => q) });

// Mirrors the server's rules so problems show up next to the question
const validate = (form, publishing) => {
  const formErrors = [];
  const questionErrors = {};

  if (!form.title.trim()) formErrors.push('Give the test a title.');
  if (publishing && form.questions.length === 0) formErrors.push('Add at least one question before publishing.');

  form.questions.forEach((q) => {
    const errors = [];
    const points = Number(q.points);
    if (!q.questionText.trim()) errors.push('Enter the question text.');
    if (!Number.isInteger(points) || points < 1 || points > 100) errors.push('Points must be a whole number from 1 to 100.');

    if (q.type === 'multiple-choice') {
      const options = q.options.map((o) => o.trim().toLowerCase());
      if (options.some((o) => !o)) errors.push('Fill in every option or remove the empty ones.');
      else if (new Set(options).size !== options.length) errors.push('Each option must be different.');
    } else if (!q.acceptedAnswers.some((a) => a.trim())) {
      errors.push('Add at least one accepted answer.');
    }

    if (errors.length) questionErrors[q.key] = errors;
  });

  return { formErrors, questionErrors, count: formErrors.length + Object.keys(questionErrors).length };
};

const QuestionEditor = ({ question, index, total, errors, onChange, onMove, onDuplicate, onRemove }) => {
  const update = (changes) => onChange({ ...question, ...changes });
  const id = question.key;

  const setOption = (optionIndex, value) =>
    update({ options: question.options.map((o, i) => (i === optionIndex ? value : o)) });

  const removeOption = (optionIndex) => {
    const options = question.options.filter((_, i) => i !== optionIndex);
    let { correctIndex } = question;
    if (optionIndex === correctIndex) correctIndex = 0;
    else if (optionIndex < correctIndex) correctIndex -= 1;
    update({ options, correctIndex });
  };

  const setAccepted = (answerIndex, value) =>
    update({ acceptedAnswers: question.acceptedAnswers.map((a, i) => (i === answerIndex ? value : a)) });

  return (
    <section className={`card question-editor ${errors ? 'has-error' : ''}`} aria-labelledby={`${id}-label`}>
      <header className="question-editor-head">
        <span id={`${id}-label`} className="question-number">
          Question {index + 1}
        </span>
        <div className="segmented segmented-sm" role="radiogroup" aria-label="Question type">
          <button
            type="button"
            role="radio"
            aria-checked={question.type === 'multiple-choice'}
            className={question.type === 'multiple-choice' ? 'active' : ''}
            onClick={() => update({ type: 'multiple-choice' })}
          >
            <ListChecks size={14} aria-hidden="true" /> Multiple choice
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={question.type === 'short-answer'}
            className={question.type === 'short-answer' ? 'active' : ''}
            onClick={() => update({ type: 'short-answer' })}
          >
            <TextCursorInput size={14} aria-hidden="true" /> Short answer
          </button>
        </div>
        <div className="question-editor-tools">
          <button type="button" className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up" title="Move up">
            <ArrowUp size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down" title="Move down">
            <ArrowDown size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={onDuplicate} aria-label="Duplicate question" title="Duplicate">
            <Copy size={16} />
          </button>
          <button type="button" className="icon-btn icon-btn-danger" onClick={onRemove} aria-label="Delete question" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div className="question-editor-row">
        <div className="field grow">
          <label htmlFor={`${id}-text`} className="field-label">Question</label>
          <textarea
            id={`${id}-text`}
            className="input textarea"
            rows={2}
            value={question.questionText}
            onChange={(e) => update({ questionText: e.target.value })}
            placeholder={question.type === 'multiple-choice' ? 'e.g. How do you say "cat" in Spanish?' : 'e.g. Translate "good morning" into French.'}
            maxLength={1000}
          />
        </div>
        <div className="field points-field">
          <label htmlFor={`${id}-points`} className="field-label">Points</label>
          <input
            id={`${id}-points`}
            type="number"
            className="input"
            min={1}
            max={100}
            value={question.points}
            onChange={(e) => update({ points: e.target.value })}
          />
        </div>
      </div>

      {question.type === 'multiple-choice' ? (
        <fieldset className="field">
          <legend className="field-label">Options — select the correct one</legend>
          <div className="option-editor-list">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className={`option-editor ${question.correctIndex === optionIndex ? 'is-correct' : ''}`}>
                <input
                  type="radio"
                  name={`${id}-correct`}
                  checked={question.correctIndex === optionIndex}
                  onChange={() => update({ correctIndex: optionIndex })}
                  aria-label={`Mark option ${String.fromCharCode(65 + optionIndex)} as correct`}
                />
                <span className="choice-key">{String.fromCharCode(65 + optionIndex)}</span>
                <input
                  className="input"
                  value={option}
                  onChange={(e) => setOption(optionIndex, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                  maxLength={200}
                  aria-label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                />
                {question.correctIndex === optionIndex && <span className="badge badge-success">Correct</span>}
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeOption(optionIndex)}
                  disabled={question.options.length <= 2}
                  aria-label={`Remove option ${String.fromCharCode(65 + optionIndex)}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          {question.options.length < MAX_OPTIONS && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ options: [...question.options, ''] })}>
              <Plus size={16} aria-hidden="true" /> Add option
            </button>
          )}
        </fieldset>
      ) : (
        <fieldset className="field">
          <legend className="field-label">Accepted answers</legend>
          <p className="field-hint">Matching ignores capital letters and extra spaces. Add other spellings you'll accept (e.g. with and without accents).</p>
          <div className="option-editor-list">
            {question.acceptedAnswers.map((answer, answerIndex) => (
              <div key={answerIndex} className="option-editor">
                <CircleDot size={16} aria-hidden="true" className="text-success" />
                <input
                  className="input"
                  value={answer}
                  onChange={(e) => setAccepted(answerIndex, e.target.value)}
                  placeholder={answerIndex === 0 ? 'Correct answer' : 'Another accepted answer'}
                  maxLength={200}
                  aria-label={`Accepted answer ${answerIndex + 1}`}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => update({ acceptedAnswers: question.acceptedAnswers.filter((_, i) => i !== answerIndex) })}
                  disabled={question.acceptedAnswers.length <= 1}
                  aria-label={`Remove accepted answer ${answerIndex + 1}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          {question.acceptedAnswers.length < MAX_ACCEPTED && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ acceptedAnswers: [...question.acceptedAnswers, ''] })}>
              <Plus size={16} aria-hidden="true" /> Add another accepted answer
            </button>
          )}
        </fieldset>
      )}

      {errors && (
        <ul className="field-errors" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

const TestEditor = () => {
  const { id: testId } = useParams();
  const isNew = !testId;
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({ title: '', description: '', questions: [blankQuestion()] }));
  const savedSnapshot = useRef(null);
  if (savedSnapshot.current === null) savedSnapshot.current = snapshotOf(form);
  const [meta, setMeta] = useState({ isPublished: false, attemptCount: 0 });
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(null); // 'draft' | 'publish'
  const [saveError, setSaveError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const errorSummaryRef = useRef(null);

  const fetchTest = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await teacherAPI.getTest(testId);
      const loaded = {
        title: res.data.title,
        description: res.data.description || '',
        questions: res.data.questions.map(fromServerQuestion),
      };
      savedSnapshot.current = snapshotOf(loaded);
      setForm(loaded);
      setMeta({ isPublished: res.data.isPublished, attemptCount: res.data.attemptCount });
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Failed to load this test.'));
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (!isNew) fetchTest();
  }, [isNew, fetchTest]);

  const isDirty = snapshotOf(form) !== savedSnapshot.current;

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!isDirty || saving) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, saving]);

  const validation = useMemo(() => validate(form, false), [form]);
  const totalPoints = form.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const updateQuestion = (key, next) =>
    setForm((prev) => ({ ...prev, questions: prev.questions.map((q) => (q.key === key ? next : q)) }));

  const moveQuestion = (index, direction) =>
    setForm((prev) => {
      const questions = [...prev.questions];
      const target = index + direction;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...prev, questions };
    });

  const duplicateQuestion = (index) =>
    setForm((prev) => {
      const questions = [...prev.questions];
      const source = questions[index];
      questions.splice(index + 1, 0, {
        ...source,
        key: newKey(),
        options: [...source.options],
        acceptedAnswers: [...source.acceptedAnswers],
      });
      return { ...prev, questions };
    });

  const removeQuestion = (key) =>
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.key !== key) }));

  const addQuestion = (type) => setForm((prev) => ({ ...prev, questions: [...prev.questions, blankQuestion(type)] }));

  const save = async (publish) => {
    setSaveError('');
    const result = validate(form, publish);
    if (result.count > 0) {
      setShowErrors(true);
      requestAnimationFrame(() => errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }

    setSaving(publish ? 'publish' : 'draft');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      isPublished: publish,
      questions: form.questions.map(toPayloadQuestion),
    };

    try {
      if (isNew) await teacherAPI.createTest(payload);
      else await teacherAPI.updateTest(testId, payload);
      savedSnapshot.current = snapshotOf(form);
      navigate('/teacher', {
        state: {
          notice: publish ? `"${payload.title}" is published — students can take it now.` : `"${payload.title}" was saved as a draft.`,
        },
      });
    } catch (err) {
      setSaveError(getErrorMessage(err, 'We could not save the test.'));
      setSaving(null);
    }
  };

  const leave = () => {
    if (isDirty) setConfirmDiscard(true);
    else navigate('/teacher');
  };

  if (loading) {
    return (
      <AppShell>
        <LoadingScreen message="Loading test…" />
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <ErrorState message={loadError} onRetry={fetchTest} />
      </AppShell>
    );
  }

  const errorsVisible = showErrors && validation.count > 0;

  return (
    <AppShell>
      <div className="page page-narrow editor-page">
        <button type="button" className="back-link" onClick={leave}>
          <ArrowLeft size={16} aria-hidden="true" /> My tests
        </button>

        <header className="page-header">
          <div>
            <h1>{isNew ? 'New test' : 'Edit test'}</h1>
            <p className="text-muted">
              {meta.isPublished ? 'Published — students can see this test.' : 'Draft — only you can see this test until you publish it.'}
            </p>
          </div>
        </header>

        {meta.attemptCount > 0 && (
          <Alert tone="warning">
            {meta.attemptCount} student{meta.attemptCount === 1 ? ' has' : 's have'} already submitted this test. Their saved scores won't
            change if you edit the questions.
          </Alert>
        )}

        {saveError && <Alert tone="error">{saveError}</Alert>}

        {errorsVisible && (
          <div ref={errorSummaryRef}>
            <Alert tone="error">
              {validation.formErrors.length > 0 ? validation.formErrors.join(' ') : 'Some questions need attention before you can save.'}
              {validation.formErrors.length > 0 && Object.keys(validation.questionErrors).length > 0 && ' Some questions also need attention.'}
            </Alert>
          </div>
        )}

        <section className="card form-stack">
          <div className="field">
            <label htmlFor="test-title" className="field-label">Title</label>
            <input
              id="test-title"
              className={`input ${errorsVisible && !form.title.trim() ? 'is-invalid' : ''}`}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Unit 2 — Common verbs"
              maxLength={150}
            />
          </div>
          <div className="field">
            <label htmlFor="test-description" className="field-label">
              Instructions <span className="text-subtle">(optional)</span>
            </label>
            <textarea
              id="test-description"
              className="input textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What should students know before they start?"
              maxLength={2000}
            />
          </div>
        </section>

        <div className="section-title-row">
          <h2 className="section-title">
            Questions <span className="count">{form.questions.length}</span>
          </h2>
          <span className="text-muted text-sm">{totalPoints} points total</span>
        </div>

        <div className="question-editor-list">
          {form.questions.map((question, index) => (
            <QuestionEditor
              key={question.key}
              question={question}
              index={index}
              total={form.questions.length}
              errors={showErrors ? validation.questionErrors[question.key] : undefined}
              onChange={(next) => updateQuestion(question.key, next)}
              onMove={(direction) => moveQuestion(index, direction)}
              onDuplicate={() => duplicateQuestion(index)}
              onRemove={() => removeQuestion(question.key)}
            />
          ))}
        </div>

        <div className="add-question">
          <span className="text-muted text-sm">Add a question</span>
          <button type="button" className="btn btn-secondary" onClick={() => addQuestion('multiple-choice')}>
            <ListChecks size={16} aria-hidden="true" /> Multiple choice
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => addQuestion('short-answer')}>
            <TextCursorInput size={16} aria-hidden="true" /> Short answer
          </button>
        </div>
      </div>

      <div className="editor-savebar">
        <div className="editor-savebar-inner">
          <span className="text-sm text-muted editor-savebar-status">
            {isDirty ? 'Unsaved changes' : 'All changes saved'} · {form.questions.length} question{form.questions.length === 1 ? '' : 's'}
          </span>
          <div className="button-row">
            <Link
              to="/teacher"
              className="btn btn-ghost hide-sm"
              onClick={(event) => {
                event.preventDefault();
                leave();
              }}
            >
              Cancel
            </Link>
            <button type="button" className="btn btn-secondary" onClick={() => save(false)} disabled={Boolean(saving)}>
              {saving === 'draft' && <Spinner size="sm" />}
              {meta.isPublished ? 'Unpublish & save' : 'Save draft'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={Boolean(saving)}>
              {saving === 'publish' && <Spinner size="sm" />}
              {meta.isPublished ? 'Save changes' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard your changes?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={() => navigate('/teacher')}
        onCancel={() => setConfirmDiscard(false)}
      >
        <p>You have unsaved changes to this test.</p>
      </ConfirmDialog>
    </AppShell>
  );
};

export default TestEditor;
