import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, TOKEN_KEY, USER_KEY } from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const homePathFor = (user) => (user?.role === 'teacher' ? '/teacher' : '/');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem(TOKEN_KEY) ? readStoredUser() : null));
  // Sessions saved before roles existed have no role, so wait for the server before routing them
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)) && !readStoredUser()?.role);

  const saveUser = useCallback((nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const signIn = useCallback(({ token, user: nextUser }) => {
    localStorage.setItem(TOKEN_KEY, token);
    saveUser(nextUser);
  }, [saveUser]);

  // Refresh the profile (name, role) in the background on page load
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authAPI
      .me()
      .then((res) => saveUser(res.data.user))
      .catch((err) => {
        if (err.response?.status === 401) signOut();
      })
      .finally(() => setChecking(false));
  }, [saveUser, signOut]);

  const value = useMemo(() => ({ user, checking, signIn, signOut }), [user, checking, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
