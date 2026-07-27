import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAPI, courseAPI } from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageDetails, setLanguageDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [refillMessage, setRefillMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardRes = await userAPI.getDashboard();
      setData(dashboardRes.data);

      const langRes = await courseAPI.getLanguages();
      setLanguages(langRes.data);

      // Check if a specific language is requested via routing state
      const incomingLanguageId = location.state?.selectedLanguageId;
      if (incomingLanguageId) {
        setSelectedLanguage(incomingLanguageId);
      } else if (dashboardRes.data.courseProgress && dashboardRes.data.courseProgress.length > 0) {
        // Find language from enrolled list with active progress
        const enrolled = dashboardRes.data.courseProgress[0];
        setSelectedLanguage(enrolled.languageId);
      } else if (langRes.data.length > 0) {
        setSelectedLanguage(langRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchLanguageDetails = async (langId) => {
    if (!langId) return;
    try {
      setDetailsLoading(true);
      const res = await courseAPI.getLanguage(langId);
      setLanguageDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLanguage) {
      fetchLanguageDetails(selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    try {
      await userAPI.deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  const handleRefillHearts = async () => {
    setRefillMessage('');
    try {
      const res = await userAPI.refillHearts();
      setRefillMessage(res.data.message);
      // Refresh dashboard stats
      const dashboardRes = await userAPI.getDashboard();
      setData(prev => ({
        ...prev,
        stats: dashboardRes.data.stats
      }));
      setTimeout(() => setRefillMessage(''), 4000);
    } catch (err) {
      setRefillMessage(err.response?.data?.message || 'Refill failed.');
      setTimeout(() => setRefillMessage(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your learning dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-msg">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">Retry</button>
      </div>
    );
  }

  // Find if user completed lesson
  const completedProgress = data?.courseProgress || [];
  const currentLangProgress = completedProgress.find(p => p.languageId === selectedLanguage);

  return (
    <div className="dashboard-layout">
      {/* LEFT SIDEBAR (Navigation) */}
      <aside className="sidebar-left">
        <div className="sidebar-brand">
          <span className="brand-logo">🌍</span>
          <h2>PolyLearn</h2>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span className="nav-icon">🏠</span> Learn
          </button>
          <button onClick={() => navigate('/languages')} className="nav-item">
            <span className="nav-icon">🎓</span> Courses
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <span className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">Student</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Log Out
          </button>
          {!showConfirmDelete ? (
            <button onClick={() => setShowConfirmDelete(true)} className="btn-logout btn-delete" style={{ color: 'var(--error)', marginTop: '8px' }}>
              🗑️ Delete Account
            </button>
          ) : (
            <div className="confirm-delete-box" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', padding: '8px', background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 'bold', textAlign: 'center' }}>Delete Account?</span>
              <button onClick={handleDeleteAccount} className="btn-delete-confirm" style={{ backgroundColor: 'var(--error)', color: 'white', padding: '6px', borderRadius: '4px', fontSize: '12px' }}>
                Confirm
              </button>
              <button onClick={() => setShowConfirmDelete(false)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px', fontSize: '11px' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MIDDLE PANEL (Language contents - Units & Lessons) */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="welcome-text">
            <h1>Welcome back, {user.name}! 👋</h1>
            <p>Select your active language course below to continue your progress.</p>
          </div>
          
          <div className="language-selector-tabs">
            {languages.map(lang => {
              const prog = completedProgress.find(p => p.languageId === lang.id);
              const percent = prog ? prog.percentComplete : 0;
              return (
                <button
                  key={lang.id}
                  className={`lang-tab-btn ${selectedLanguage === lang.id ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage(lang.id)}
                >
                  <span className="lang-tab-flag">{lang.code === 'es' ? '🇪🇸' : lang.code === 'fr' ? '🇫🇷' : lang.code === 'ja' ? '🇯🇵' : '🏳️'}</span>
                  <div className="lang-tab-info">
                    <span className="lang-tab-name">{lang.name}</span>
                    <span className="lang-tab-percent">{percent}% completed</span>
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        {detailsLoading ? (
          <div className="lessons-loading">
            <div className="spinner-small"></div>
            <p>Loading course modules...</p>
          </div>
        ) : languageDetails ? (
          <div className="course-modules">
            {languageDetails.units && languageDetails.units.length > 0 ? (
              languageDetails.units.map((unit, uIdx) => {
                // Calculate unit completion
                const unitLessons = unit.lessons || [];
                return (
                  <div key={unit.id} className="unit-card">
                    <div className="unit-header">
                      <div className="unit-title-group">
                        <span className="unit-badge">UNIT {unit.orderIndex}</span>
                        <h2>{unit.title}</h2>
                      </div>
                    </div>

                    <div className="lessons-list">
                      {unitLessons.map((lesson) => {
                        // Check if completed. We can verify against list of completed lessons
                        // Since completed progress lesson ids are hard to track nested, 
                        // let's pass down and map it properly.
                        // Let's check:
                        // Find this lesson in user progress returned by backend.
                        // Since backend returns user progress in dashboard under completedProgress (implicit)
                        // Wait! The backend returns list of course progress summary.
                        // Wait! In `getDashboard`, we did not return the exact list of completed lesson IDs!
                        // Let's modify the controller `getDashboard` to also return the exact completed lesson IDs list
                        // so that we can easily render a checkmark or percent beside each lesson.
                        // Let's see: user stats are returned, courseProgress is returned, leaderboard is returned.
                        // Wait, we returned:
                        // const completedProgress = await UserProgress.findAll({ where: { userId } });
                        // Yes! But we only mapped it to courseProgress. Let's see if we should return the raw completedLessonIds list.
                        // Actually, we can return the completed progress lessonIds in the response too! Let's check `getDashboard` in `userController.js`.
                        // Yes! In `getDashboard` we wrote:
                        // const completedLessonIds = new Set(completedProgress.map(p => p.lessonId));
                        // We did not put `completedLessonIds` directly in the json response. We can easily edit `getDashboard` to include `completedLessonIds: Array.from(completedLessonIds)`.
                        // But wait! Even without it, we can fetch all lesson records, and let the backend return the progress database records, or we can check the completedLessons count.
                        // Wait, let's look at `userController.js` and modify it later to return `completedLessonIds`. That would make it extremely easy.
                        // Wait, does the dashboard currently have any other way? We can just edit `userController.js` to return `completedLessonIds`. It will take a few seconds and make the UI perfect!
                        // Let's assume the backend will return `completedLessonIds: Array.from(completedLessonIds)`.
                        // Let's write the code under that assumption. If a lesson ID is in `data.completedLessonIds`, we render it as Completed!
                        const isCompleted = data.completedLessonIds?.includes(lesson.id);

                        return (
                          <div key={lesson.id} className={`lesson-node-card ${isCompleted ? 'completed' : ''}`}>
                            <div className="lesson-node-info">
                              <div className="lesson-icon-wrapper">
                                {isCompleted ? '✅' : '📖'}
                              </div>
                              <div className="lesson-text">
                                <h3>{lesson.title}</h3>
                                <p>{isCompleted ? 'Review this lesson to earn extra XP' : 'Start lesson and test your knowledge'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (data.stats.hearts === 0 && !isCompleted) {
                                  setRefillMessage('You have 0 hearts! Please refill hearts in the sidebar to start new lessons.');
                                  return;
                                }
                                navigate(`/lesson/${lesson.id}`);
                              }}
                              className={`btn-lesson-action ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                            >
                              {isCompleted ? 'Review' : 'Start'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-content">No units available for this language yet.</p>
            )}
          </div>
        ) : (
          <p className="no-content">Please select a language course.</p>
        )}
      </main>

      {/* RIGHT SIDEBAR (Stats & Leaderboard) */}
      <aside className="sidebar-right">
        {/* User Stats Panel */}
        <div className="stats-widget">
          <h3>Your Progress Stats</h3>
          <div className="stats-grid">
            <div className="stat-card streak">
              <span className="stat-icon">🔥</span>
              <div className="stat-values">
                <span className="stat-num">{data.stats.streakCount}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>
            
            <div className="stat-card xp">
              <span className="stat-icon">⭐</span>
              <div className="stat-values">
                <span className="stat-num">{data.stats.xp}</span>
                <span className="stat-label">Total XP</span>
              </div>
            </div>

            <div className="stat-card hearts">
              <span className="stat-icon">❤️</span>
              <div className="stat-values">
                <span className="stat-num">{data.stats.hearts} / 5</span>
                <span className="stat-label">Hearts Left</span>
              </div>
            </div>
          </div>

          <div className="hearts-refill-panel">
            <button 
              onClick={handleRefillHearts} 
              className="btn-refill-hearts"
              disabled={data.stats.hearts >= 5}
            >
              ❤️ Refill Hearts (Costs 50 XP)
            </button>
            {refillMessage && <p className="refill-message">{refillMessage}</p>}
          </div>
        </div>

        {/* Leaderboard Panel */}
        <div className="leaderboard-widget">
          <h3>Global Leaderboard</h3>
          <div className="leaderboard-list">
            {data.leaderboard && data.leaderboard.length > 0 ? (
              data.leaderboard.map((player) => (
                <div 
                  key={player.userId} 
                  className={`leaderboard-item ${player.userId === user.id ? 'current-user' : ''}`}
                >
                  <span className="player-rank">#{player.rank}</span>
                  <span className="player-name">{player.name}</span>
                  <div className="player-xp-details">
                    <span className="player-xp">{player.xp} XP</span>
                    <span className="player-streak">🔥 {player.streak}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-content">No active users yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
