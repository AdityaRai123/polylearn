import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI, userAPI } from '../services/api';

const CourseSelector = () => {
  const [languages, setLanguages] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const langRes = await courseAPI.getLanguages();
        setLanguages(langRes.data);

        const dashRes = await userAPI.getDashboard();
        setDashboardData(dashRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectLanguage = (langId) => {
    // Navigate back to Dashboard with selected course in state or search params
    navigate('/', { state: { selectedLanguageId: langId } });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading course catalogue...</p>
      </div>
    );
  }

  return (
    <div className="course-selector-container">
      <header className="course-selector-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1>Choose a Language Course</h1>
        <p>Add a new language or switch your active learning track. All progress is automatically tracked!</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="courses-grid">
        {languages.map((lang) => {
          // Check progress if enrolled
          const prog = dashboardData?.courseProgress?.find(p => p.languageId === lang.id);
          const isEnrolled = !!prog;
          const percentage = prog ? prog.percentComplete : 0;
          
          return (
            <div key={lang.id} className="course-card">
              <div className="course-flag-banner">
                {lang.code === 'es' ? '🇪🇸' : lang.code === 'fr' ? '🇫🇷' : lang.code === 'ja' ? '🇯🇵' : '🏳️'}
              </div>
              <div className="course-card-body">
                <h2>{lang.name}</h2>
                <p className="course-meta">Code: {lang.code.toUpperCase()}</p>
                {isEnrolled ? (
                  <div className="enrollment-status">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span>{percentage}% completed</span>
                  </div>
                ) : (
                  <span className="not-enrolled-label">Not enrolled yet</span>
                )}
              </div>
              <button
                onClick={() => handleSelectLanguage(lang.id)}
                className={`btn-course-action ${isEnrolled ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isEnrolled ? 'Switch to Course' : 'Start Learning'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseSelector;
