import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Create api instance that updates when token changes
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: `${API_URL}/api`,
    });
    
    // Add request interceptor to always use latest token
    instance.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });
    
    return instance;
  }, []);

  const fetchUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setLoading(false);
      setInitialized(true);
      return;
    }
    
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setTenant(response.data.tenant);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only logout if the token is actually invalid
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setTenant(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [api]);

  useEffect(() => {
    // Only fetch user on initial load
    if (!initialized) {
      fetchUser();
    }
  }, [initialized, fetchUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    // Fetch tenant info
    try {
      const meResponse = await api.get('/auth/me');
      setTenant(meResponse.data.tenant);
    } catch (e) {
      console.error('Failed to fetch tenant:', e);
    }
    return userData;
  };

  const register = async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    // Fetch tenant info
    try {
      const meResponse = await api.get('/auth/me');
      setTenant(meResponse.data.tenant);
    } catch (e) {
      console.error('Failed to fetch tenant:', e);
    }
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  const value = {
    user,
    tenant,
    token,
    loading,
    login,
    register,
    logout,
    api,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
