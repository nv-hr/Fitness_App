import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as apiLogout, login as loginApi, register as registerApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await getMe();
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    setUser(response.data.user);
    return response;
  };

  const register = async (data) => {
    const response = await registerApi(data);
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
