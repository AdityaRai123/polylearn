import { Navigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';
import { LoadingScreen } from './ui';

// Requires a signed-in user, and optionally a specific role ('student' or 'teacher')
const ProtectedRoute = ({ role, children }) => {
  const { user, checking } = useAuth();

  if (checking) {
    return <LoadingScreen message="Loading your account…" />;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (role && (user.role || 'student') !== role) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;
