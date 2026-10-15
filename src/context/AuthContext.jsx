import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokens, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return tokens.get().access ? JSON.parse(localStorage.getItem('rms_user')) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokens.clear();
      setUser(null);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    tokens.set(data.accessToken, data.refreshToken);
    localStorage.setItem('rms_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (form) => {
      await api.post('/auth/register', form);
      await login(form.email, form.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    const { refresh } = tokens.get();
    if (refresh) api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    tokens.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);