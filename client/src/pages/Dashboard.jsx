import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ClipboardList, Flame, Heart, Star, Trophy } from 'lucide-react';
import AppShell from '../components/AppShell';
import { Alert, EmptyState, ErrorState, LanguageBadge, LoadingBlock, LoadingScreen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { courseAPI, getErrorMessage, testAPI, userAPI } from '../services/api';

const MAX_HEARTS = 5;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [pendingTests, setPendingTests] = useState([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState(location.state?.selectedLanguageId ?? null);
  const [languageDetails, setLanguageDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [refilling, setRefilling] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, languagesRes, testsRes] = await Promise.all([
        userAPI.getDashboard(),
        courseAPI.getLanguages(),
        testAPI.list().catch(() => ({ data: [] })),
      ]);
      setData(dashboardRes.data);
      setLanguages(languagesRes.data);
      setPendingTests(testsRes.data.filter((test) => !test.attempt));

      // Default to the course with the most progress, otherwise the first course
      setSelectedLanguageId((current) => {
        if (current) return current;
        const inProgress = [...dashboardRes.data.courseProgress].sort((a, b) => b.completedLessons - a.completedLessons)[0];
        return inProgress?.completedLessons ? inProgress.languageId : languagesRes.data[0]?.id ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!selectedLanguageId) return undefined;
    let cancelled = false;
    setDetailsLoading(true);
    courseAPI
      .getLanguage(selectedLanguageId)
      .then((res) => !cancelled && setLanguageDetails(res.data))
      .catch(() => !cancelled && setLanguageDetails(null))
      .finally(() => !cancelled && setDetailsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedLanguageId]);

  // Clear notices after a few seconds
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleRefillHearts = async () => {
    setRefilling(true);
    try {
      const res = await userAPI.refillHearts();
      setData((prev) => ({ ...prev, stats: { ...prev.stats, hearts: res.data.hearts, xp: res.data.xp } }));
      setNotice({ tone: 'success', text: res.data.message });
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err, 'Refill failed.') });
    } finally {
      setRefilling(false);
    }
  };

  const startLesson = (lessonId, isCompleted) => {
    if (data.stats.hearts === 0 && !isCompleted) {
      setNotice({ tone: 'warning', text: 'You are out of hearts. Refill them to start a new lesson.' });
      return;
    }
    navigate(`/lesson/${lessonId}`);
  };

  if (loading && !data) {
    return (
      <AppShell>
        <LoadingScreen message="Loading your dashboard…" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState message={error} onRetry={fetchDashboard} />
      </AppShell>
    );
  }

  const { stats, courseProgress, completedLessonIds, leaderboard } = data;
  const completed = new Set(completedLessonIds);
  const progressFor = (languageId) => courseProgress.find((p) => p.languageId === languageId);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <AppShell>
      <div className="page page-wide">
        <header className="page-header">
          <div>
            <h1>Welcome back, {firstName}</h1>
            <p className="text-muted">Pick up where you left off, or try something new.</p>
          </div>
        </header>

        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="language-tabs" role="tablist" aria-label="Courses">
              {languages.map((lang) => {
                const percent = progressFor(lang.id)?.percentComplete ?? 0;
                const active = selectedLanguageId === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`language-tab ${active ? 'active' : ''}`}
                    onClick={() => setSelectedLanguageId(lang.id)}
                  >
                    <LanguageBadge code={lang.code} />
                    <span className="language-tab-text">
                      <strong>{lang.name}</strong>
                      <small>{percent}% complete</small>
                    </span>
                  </button>
                );
              })}
            </div>

            {detailsLoading ? (
              <LoadingBlock message="Loading lessons…" />
            ) : !languageDetails ? (
              <EmptyState icon={BookOpen} title="Choose a course">Select a language above to see its lessons.</EmptyState>
            ) : languageDetails.units.length === 0 ? (
              <EmptyState icon={BookOpen} title="No lessons yet">This course doesn't have any units yet.</EmptyState>
            ) : (
              <div className="unit-list">
                {languageDetails.units.map((unit) => {
                  const doneCount = unit.lessons.filter((lesson) => completed.has(lesson.id)).length;
                  return (
                    <section key={unit.id} className="card unit-card">
                      <header className="unit-header">
                        <div>
                          <span className="eyebrow">Unit {unit.orderIndex}</span>
                          <h2>{unit.title}</h2>
                        </div>
                        <span className="text-muted text-sm">
                          {doneCount}/{unit.lessons.length} done
                        </span>
                      </header>
                      <ul className="lesson-list">
                        {unit.lessons.map((lesson) => {
                          const isCompleted = completed.has(lesson.id);
                          return (
                            <li key={lesson.id} className={`lesson-row ${isCompleted ? 'completed' : ''}`}>
                              <span className="lesson-row-icon" aria-hidden="true">
                                {isCompleted ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                              </span>
                              <div className="lesson-row-text">
                                <h3>{lesson.title}</h3>
                                <p>{isCompleted ? 'Completed — review it for extra XP' : 'Not started yet'}</p>
                              </div>
                              <button
                                type="button"
                                className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={() => startLesson(lesson.id, isCompleted)}
                              >
                                {isCompleted ? 'Review' : 'Start'}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="dashboard-side">
            <section className="card">
              <h2 className="card-title">Your stats</h2>
              <div className="stat-grid">
                <div className="stat-tile tone-gold">
                  <Flame size={20} aria-hidden="true" />
                  <strong>{stats.streakCount}</strong>
                  <span>Day streak</span>
                </div>
                <div className="stat-tile tone-brand">
                  <Star size={20} aria-hidden="true" />
                  <strong>{stats.xp}</strong>
                  <span>Total XP</span>
                </div>
                <div className="stat-tile tone-heart">
                  <Heart size={20} aria-hidden="true" />
                  <strong>
                    {stats.hearts}/{MAX_HEARTS}
                  </strong>
                  <span>Hearts</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={handleRefillHearts}
                disabled={stats.hearts >= MAX_HEARTS || refilling}
              >
                <Heart size={16} aria-hidden="true" />
                {stats.hearts >= MAX_HEARTS ? 'Hearts are full' : 'Refill hearts (50 XP)'}
              </button>
            </section>

            <section className="card">
              <div className="card-title-row">
                <h2 className="card-title">Tests</h2>
                <Link to="/tests" className="link">View all</Link>
              </div>
              {pendingTests.length === 0 ? (
                <p className="text-muted text-sm">You're all caught up — no tests waiting.</p>
              ) : (
                <ul className="mini-list">
                  {pendingTests.slice(0, 3).map((test) => (
                    <li key={test.id}>
                      <ClipboardList size={18} aria-hidden="true" className="text-brand" />
                      <div className="mini-list-text">
                        <strong>{test.title}</strong>
                        <small>
                          {test.questionCount} questions · {test.teacherName}
                        </small>
                      </div>
                      <Link to={`/tests/${test.id}`} className="btn btn-primary btn-sm">Start</Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2 className="card-title">
                <Trophy size={18} aria-hidden="true" className="text-gold" /> Leaderboard
              </h2>
              {leaderboard.length === 0 ? (
                <p className="text-muted text-sm">No learners yet.</p>
              ) : (
                <ol className="leaderboard">
                  {leaderboard.map((player) => (
                    <li key={player.userId} className={player.userId === user?.id ? 'is-me' : ''}>
                      <span className={`rank rank-${player.rank}`}>{player.rank}</span>
                      <span className="leaderboard-name">
                        {player.name}
                        {player.userId === user?.id && <small> (you)</small>}
                      </span>
                      <span className="leaderboard-xp">{player.xp} XP</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
