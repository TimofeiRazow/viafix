import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        // Здесь можно добавить запрос для проверки токена
        // const userData = await authAPI.getMe();
        // setUser(userData);
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const response = await authAPI.login(username, password);
    const { access_token } = response.data;
    
    localStorage.setItem('auth_token', access_token);
    setUser({ username }); // В реальном приложении получите данные пользователя
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { access_token } = response.data;
    
    localStorage.setItem('auth_token', access_token);
    setUser({ username: userData.username });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};