import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ICustomer, CustomerSignupRequest } from '@car-rental/shared';
import { api } from '../services/apiClient';

interface CustomerAuthContextType {
  customer: ICustomer | null;
  isCustomerAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (data: CustomerSignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkCustomerAuth: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkCustomerAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/customer/me');
      if (res.success && res.data?.customer) {
        setCustomer(res.data.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkCustomerAuth();
  }, [checkCustomerAuth]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/customer/login', { identifier, password });
    if (res.success && res.data?.customer) {
      setCustomer(res.data.customer);
    } else {
      throw new Error(res.error || 'Login failed');
    }
  };

  const signup = async (data: CustomerSignupRequest) => {
    const res = await api.post('/customer/signup', data);
    if (res.success && res.data?.customer) {
      setCustomer(res.data.customer);
    } else {
      throw new Error(res.error || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/customer/logout', {});
    } finally {
      setCustomer(null);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isCustomerAuthenticated: !!customer,
        isLoading,
        login,
        signup,
        logout,
        checkCustomerAuth,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

