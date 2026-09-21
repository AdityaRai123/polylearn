import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpenCheck, ClipboardCheck, Flame, GraduationCap, Presentation, UserRound } from 'lucide-react';
import { authAPI, getErrorMessage } from '../services/api';
import { homePathFor, useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/ui';

const DEMO_ACCOUNTS = [
  { label: 'Student', hint: 'Progress seeded', email: 'student@polylearn.com', password: 'password123' },
  { label: 'Fresh student', hint: 'Empty progress', email: 'demo@polylearn.com', password: 'demo123' },
  { label: 'Teacher', hint: 'Creates tests', email: 'teacher@polylearn.com', password: 'teacher123' },
];

const FEATURES = [
  { icon: BookOpenCheck, text: 'Bite-sized lessons in Spanish, French and Japanese' },
  { icon: ClipboardCheck, text: 'Tests set by your teacher, scored the moment you submit' },
  { icon: Flame, text: 'XP, daily streaks and a class leaderboard' },
];

const Auth = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', teacherCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const [teacherSignupEnabled, setTeacherSignupEnabled] = useState(null);

  const isLogin = mode === 'login';

  useEffect(() => {
    authAPI
      .config()
      .then((res) => setTeacherSignupEnabled(res.data.teacherSignupEnabled))
      .catch(() => setTeacherSignupEnabled(null));
  }, []);

  // Free hosting sleeps when idle; tell the user why the first request is slow
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setSlowServer(true), 4000);
    return () => {
      clearTimeout(timer);
      setSlowServer(false);
    };
  }, [loading]);

  if (user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  const updateField = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const fillDemoAccount = (account) => {
    setForm((prev) => ({ ...prev, email: account.email, password: account.password }));
    switchMode('login');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = isLogin
        ? await authAPI.login(form.email, form.password)
        : await authAPI.signup({
            name: form.name,
            email: form.email,
            password: form.password,
            role,
            teacherCode: role === 'teacher' ? form.teacherCode : undefined,
          });

      signIn(response.data);
      navigate(homePathFor(response.data.user), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero" aria-hidden="true">
        <div className="auth-hero-inner">
          <div className="sidebar-brand">
            <span className="brand-mark">
              <GraduationCap size={20} />
            </span>
            <span className="brand-name">PolyLearn</span>
          </div>
          <h1>Learn a language a few minutes at a time.</h1>
          <ul className="auth-features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="auth-feature-icon">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="sidebar-brand auth-mobile-brand">
              <span className="brand-mark">
                <GraduationCap size={20} />
              </span>
              <span className="brand-name">PolyLearn</span>
            </div>
            <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p className="text-muted">
              {isLogin ? 'Log in to continue where you left off.' : 'It only takes a minute.'}
            </p>
          </div>

          <div className="segmented" role="tablist" aria-label="Log in or sign up">
            <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'active' : ''} onClick={() => switchMode('login')}>
              Log in
            </button>
            <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'active' : ''} onClick={() => switchMode('signup')}>
              Sign up
            </button>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="form-stack">
            {!isLogin && (
              <>
                <fieldset className="field">
                  <legend className="field-label">I am a…</legend>
                  <div className="role-picker">
                    <label className={`role-option ${role === 'student' ? 'selected' : ''}`}>
                      <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
                      <UserRound size={20} aria-hidden="true" />
                      <span>
                        <strong>Student</strong>
                        <small>Take lessons and tests</small>
                      </span>
                    </label>
                    <label className={`role-option ${role === 'teacher' ? 'selected' : ''}`}>
                      <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} />
                      <Presentation size={20} aria-hidden="true" />
                      <span>
                        <strong>Teacher</strong>
                        <small>Create and grade tests</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="field">
                  <label htmlFor="name" className="field-label">Full name</label>
                  <input id="name" className="input" value={form.name} onChange={updateField('name')} placeholder="Your name" autoComplete="name" required />
                </div>
              </>
            )}

            <div className="field">
              <label htmlFor="email" className="field-label">Email</label>
              <input id="email" type="email" className="input" value={form.email} onChange={updateField('email')} placeholder="you@example.com" autoComplete="email" required />
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={form.password}
                onChange={updateField('password')}
                placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? undefined : 6}
                required
              />
            </div>

            {!isLogin && (
              <div className="field">
                <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
                <input id="confirmPassword" type="password" className="input" value={form.confirmPassword} onChange={updateField('confirmPassword')} autoComplete="new-password" required />
              </div>
            )}

            {!isLogin && role === 'teacher' && (
              <div className="field">
                <label htmlFor="teacherCode" className="field-label">Teacher access code</label>
                <input id="teacherCode" className="input" value={form.teacherCode} onChange={updateField('teacherCode')} placeholder="Provided by your school" autoComplete="off" required />
                <p className="field-hint">
                  {teacherSignupEnabled === false
                    ? 'Teacher sign-up is turned off on this server. Ask your administrator for an account.'
                    : 'Teacher accounts need an access code so students can’t create them.'}
                </p>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading && <Spinner size="sm" />}
              {loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </button>

            {slowServer && (
              <p className="field-hint text-center">The server is waking up — this can take up to a minute the first time.</p>
            )}
          </form>

          <div className="demo-accounts">
            <p className="demo-accounts-title">Demo accounts</p>
            <div className="demo-accounts-list">
              {DEMO_ACCOUNTS.map((account) => (
                <button key={account.email} type="button" className="demo-chip" onClick={() => fillDemoAccount(account)}>
                  <strong>{account.label}</strong>
                  <span>{account.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Auth;
