import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import AppShell from '../components/AppShell';
import { EmptyState, ErrorState, LoadingScreen } from '../components/ui';
import { getErrorMessage, testAPI } from '../services/api';
import { formatDate, scoreTone } from '../utils/format';

const TestCard = ({ test }) => {
  const { attempt } = test;
  return (
    <article className="card test-card">
      <div className="test-card-head">
        <span className={`test-card-icon ${attempt ? 'is-done' : ''}`} aria-hidden="true">
          {attempt ? <CheckCircle2 size={20} /> : <ClipboardList size={20} />}
        </span>
        {attempt && <span className={`badge badge-${scoreTone(attempt.score)}`}>{attempt.score}%</span>}
      </div>
      <h2>{test.title}</h2>
      {test.description && <p className="text-muted text-sm line-clamp">{test.description}</p>}
      <p className="test-card-meta">
        {test.questionCount} question{test.questionCount === 1 ? '' : 's'} · {test.totalPoints} pts · {test.teacherName}
      </p>
      {attempt ? (
        <>
          <p className="text-subtle text-sm">Submitted {formatDate(attempt.submittedAt)}</p>
          <Link to={`/tests/${test.id}/result`} className="btn btn-secondary btn-block">
            View result
          </Link>
        </>
      ) : (
        <Link to={`/tests/${test.id}`} className="btn btn-primary btn-block">
          Start test
        </Link>
      )}
    </article>
  );
};

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await testAPI.list();
      setTests(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load tests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const pending = tests.filter((test) => !test.attempt);
  const completed = tests.filter((test) => test.attempt);

  return (
    <AppShell>
      {loading ? (
        <LoadingScreen message="Loading tests…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTests} />
      ) : (
        <div className="page">
          <header className="page-header">
            <div>
              <h1>Tests</h1>
              <p className="text-muted">Tests from your teachers. You get one attempt, and your score appears right after you submit.</p>
            </div>
          </header>

          {tests.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No tests yet">
              When a teacher publishes a test, it will show up here.
            </EmptyState>
          ) : (
            <>
              <section className="section">
                <h2 className="section-title">
                  To do <span className="count">{pending.length}</span>
                </h2>
                {pending.length === 0 ? (
                  <p className="text-muted">Nothing left to do. Nice work!</p>
                ) : (
                  <div className="card-grid">
                    {pending.map((test) => <TestCard key={test.id} test={test} />)}
                  </div>
                )}
              </section>

              {completed.length > 0 && (
                <section className="section">
                  <h2 className="section-title">
                    Completed <span className="count">{completed.length}</span>
                  </h2>
                  <div className="card-grid">
                    {completed.map((test) => <TestCard key={test.id} test={test} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default Tests;
