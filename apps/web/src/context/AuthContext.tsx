import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/apiClient';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'dispatcher';
}

interface AuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.data?.user) {
        setAdminUser(res.data.user);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data?.user) {
      setAdminUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      setAdminUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

