import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardList, Eye, EyeOff, Pencil, Plus, Trash2, Users } from 'lucide-react';
import AppShell from '../../components/AppShell';
import { Alert, ConfirmDialog, EmptyState, ErrorState, LoadingScreen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, teacherAPI } from '../../services/api';
import { formatDate, scoreTone } from '../../utils/format';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The editor passes a success message along when it navigates back here
  const [notice, setNotice] = useState(() => (location.state?.notice ? { tone: 'success', text: location.state.notice } : null));
  const [busyId, setBusyId] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherAPI.listTests();
      setTests(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your tests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Drop the message from history so a refresh doesn't show it again
  useEffect(() => {
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const togglePublished = async (test) => {
    setBusyId(test.id);
    setNotice(null);
    try {
      const res = await teacherAPI.setPublished(test.id, !test.isPublished);
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, isPublished: res.data.isPublished } : t)));
      setNotice({
        tone: 'success',
        text: res.data.isPublished ? `"${test.title}" is now visible to students.` : `"${test.title}" is hidden from students.`,
      });
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const deleteTest = async () => {
    const test = testToDelete;
    setBusyId(test.id);
    try {
      await teacherAPI.deleteTest(test.id);
      setTests((prev) => prev.filter((t) => t.id !== test.id));
      setNotice({ tone: 'success', text: `"${test.title}" was deleted.` });
      setTestToDelete(null);
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err) });
      setTestToDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  const totalSubmissions = tests.reduce((sum, t) => sum + t.attemptCount, 0);
  const scoredTests = tests.filter((t) => t.averageScore !== null);
  const overallAverage = totalSubmissions
    ? Math.round(scoredTests.reduce((sum, t) => sum + t.averageScore * t.attemptCount, 0) / totalSubmissions)
    : null;

  return (
    <AppShell>
      {loading ? (
        <LoadingScreen message="Loading your tests…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTests} />
      ) : (
        <div className="page">
          <header className="page-header">
            <div>
              <h1>My tests</h1>
              <p className="text-muted">Hi {user?.name} — create tests, publish them to students and track scores.</p>
            </div>
            <Link to="/teacher/tests/new" className="btn btn-primary">
              <Plus size={18} aria-hidden="true" /> New test
            </Link>
          </header>

          {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

          <div className="metric-grid">
            <div className="stat-tile">
              <strong>{tests.length}</strong>
              <span>Tests</span>
            </div>
            <div className="stat-tile">
              <strong>{tests.filter((t) => t.isPublished).length}</strong>
              <span>Published</span>
            </div>
            <div className="stat-tile">
              <strong>{totalSubmissions}</strong>
              <span>Submissions</span>
            </div>
            <div className="stat-tile">
              <strong>{overallAverage === null ? '—' : `${overallAverage}%`}</strong>
              <span>Average score</span>
            </div>
          </div>

          {tests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Create your first test"
              action={
                <Link to="/teacher/tests/new" className="btn btn-primary">
                  <Plus size={18} aria-hidden="true" /> New test
                </Link>
              }
            >
              Add multiple-choice or short-answer questions, then publish the test so students can take it.
            </EmptyState>
          ) : (
            <ul className="teacher-test-list">
              {tests.map((test) => (
                <li key={test.id} className="card teacher-test">
                  <div className="teacher-test-main">
                    <div className="teacher-test-title">
                      <h2>{test.title}</h2>
                      <span className={`badge ${test.isPublished ? 'badge-success' : 'badge-muted'}`}>
                        {test.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="teacher-test-meta">
                      <span>
                        {test.questionCount} question{test.questionCount === 1 ? '' : 's'} · {test.totalPoints} pts
                      </span>
                      <span>
                        <Users size={14} aria-hidden="true" /> {test.attemptCount} submission{test.attemptCount === 1 ? '' : 's'}
                      </span>
                      {test.averageScore !== null && (
                        <span className={`text-${scoreTone(test.averageScore)}`}>Avg {test.averageScore}%</span>
                      )}
                      <span className="text-subtle">Updated {formatDate(test.updatedAt)}</span>
                    </p>
                  </div>
                  <div className="teacher-test-actions">
                    <Link to={`/teacher/tests/${test.id}/submissions`} className="btn btn-secondary btn-sm">
                      <BarChart3 size={16} aria-hidden="true" /> Results
                    </Link>
                    <Link to={`/teacher/tests/${test.id}/edit`} className="btn btn-secondary btn-sm">
                      <Pencil size={16} aria-hidden="true" /> Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => togglePublished(test)}
                      disabled={busyId === test.id || (!test.isPublished && test.questionCount === 0)}
                      title={!test.isPublished && test.questionCount === 0 ? 'Add questions before publishing' : undefined}
                    >
                      {test.isPublished ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      {test.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      onClick={() => setTestToDelete(test)}
                      disabled={busyId === test.id}
                      aria-label={`Delete ${test.title}`}
                      title="Delete test"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(testToDelete)}
        title="Delete this test?"
        confirmLabel="Delete test"
        tone="danger"
        busy={busyId === testToDelete?.id}
        onConfirm={deleteTest}
        onCancel={() => setTestToDelete(null)}
      >
        <p>
          <strong>{testToDelete?.title}</strong> and{' '}
          {testToDelete?.attemptCount
            ? `all ${testToDelete.attemptCount} student submission${testToDelete.attemptCount === 1 ? '' : 's'}`
            : 'its questions'}{' '}
          will be permanently deleted.
        </p>
      </ConfirmDialog>
    </AppShell>
  );
};

export default TeacherDashboard;
