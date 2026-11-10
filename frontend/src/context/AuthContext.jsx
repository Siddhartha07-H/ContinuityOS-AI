import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('continuityos_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
        } catch {
          // Token expired or invalid
          localStorage.removeItem('continuityos_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto demo login so user can immediately browse or test without hurdles
        try {
          const res = await api.auth.demoLogin();
          localStorage.setItem('continuityos_token', res.access_token);
          setToken(res.access_token);
          setUser(res.user);
        } catch (e) {
          console.warn("Auto-demo login failed:", e);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem('continuityos_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    localStorage.setItem('continuityos_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const demoLogin = async () => {
    const res = await api.auth.demoLogin();
    localStorage.setItem('continuityos_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('continuityos_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

