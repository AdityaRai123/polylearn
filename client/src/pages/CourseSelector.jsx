import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { ErrorState, LanguageBadge, LoadingScreen, ProgressBar } from '../components/ui';
import { courseAPI, getErrorMessage, userAPI } from '../services/api';

const CourseSelector = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [languagesRes, dashboardRes] = await Promise.all([courseAPI.getLanguages(), userAPI.getDashboard()]);
      setLanguages(languagesRes.data);
      setCourseProgress(dashboardRes.data.courseProgress);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load courses.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppShell>
      {loading ? (
        <LoadingScreen message="Loading courses…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <div className="page">
          <header className="page-header">
            <div>
              <h1>Courses</h1>
              <p className="text-muted">Switch languages any time — progress in each course is saved.</p>
            </div>
          </header>

          <div className="card-grid">
            {languages.map((lang) => {
              const progress = courseProgress.find((p) => p.languageId === lang.id);
              const started = progress && progress.completedLessons > 0;
              return (
                <article key={lang.id} className="card course-card">
                  <LanguageBadge code={lang.code} size="lg" />
                  <div>
                    <h2>{lang.name}</h2>
                    <p className="text-muted text-sm">
                      {progress ? `${progress.completedLessons} of ${progress.totalLessons} lessons completed` : 'No lessons yet'}
                    </p>
                  </div>
                  <ProgressBar value={progress?.percentComplete ?? 0} label={`${lang.name} progress`} />
                  <button
                    type="button"
                    className={`btn btn-block ${started ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => navigate('/', { state: { selectedLanguageId: lang.id } })}
                  >
                    {started ? 'Continue' : 'Start learning'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default CourseSelector;
