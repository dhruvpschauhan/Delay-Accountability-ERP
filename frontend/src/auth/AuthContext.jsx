import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiLogin } from '../api/endpoints';

const TOKEN_KEY = 'idas_token';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decode token and restore user session
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        } else {
          setUser({
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
            plant_id: decoded.plant_id,
          });
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = useCallback(async (username, password) => {
    const response = await apiLogin(username, password);
    const accessToken = response.data.access_token;
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    return accessToken;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = useMemo(
    () => ({ user, token, loading, isAuthenticated, login, logout }),
    [user, token, loading, isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
