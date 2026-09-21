import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, FilePlus2, GraduationCap, House, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, userAPI } from '../services/api';
import { Alert, ConfirmDialog } from './ui';

const NAV_ITEMS = {
  student: [
    { to: '/', label: 'Learn', icon: House, end: true },
    { to: '/languages', label: 'Courses', icon: BookOpen },
    { to: '/tests', label: 'Tests', icon: ClipboardList },
  ],
  teacher: [
    { to: '/teacher', label: 'My tests', icon: ClipboardList, end: true },
    { to: '/teacher/tests/new', label: 'New test', icon: FilePlus2 },
  ],
};

// Page frame with the sidebar (desktop) / top bar (mobile) navigation
const AppShell = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const role = user?.role || 'student';

  const handleLogout = () => {
    signOut();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await userAPI.deleteAccount();
      signOut();
      navigate('/auth');
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete account.'));
      setDeleting(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <GraduationCap size={20} />
          </span>
          <span className="brand-name">PolyLearn</span>
          {role === 'teacher' && <span className="badge badge-brand">Teacher</span>}
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS[role].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <div className="user-chip-text">
              <span className="user-chip-name">{user?.name}</span>
              <span className="user-chip-role">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              <span>Log out</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-ghost-danger"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete account"
              title="Delete account"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">{children}</main>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        confirmLabel="Delete account"
        tone="danger"
        busy={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>
          {role === 'teacher'
            ? 'This permanently deletes your account, every test you created and all student submissions for those tests.'
            : 'This permanently deletes your account, XP, streak, lesson progress and test results.'}
        </p>
        {deleteError && <Alert tone="error">{deleteError}</Alert>}
      </ConfirmDialog>
    </div>
  );
};

export default AppShell;
