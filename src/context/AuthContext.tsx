'use client';

import { createContext, useState, useContext, ReactNode, FC, useEffect, useCallback } from 'react';
import { getAuthToken } from '@/services/api';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { TOKEN_KEY } from '@/lib/constants';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  token: string | null;
  isPending: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  error: Error | null;
  isAuthReady: boolean;
}

const AuthContext: React.Context<AuthContextType | undefined> = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const { mutate, isPending, error }: UseMutationResult<string, Error, LoginCredentials> = useMutation<string, Error, LoginCredentials>({
    mutationFn: getAuthToken,
    onSuccess: (data: string): void => {
      setToken(data);
      localStorage.setItem(TOKEN_KEY, data);
    },
  });

  const login = (email: string, password: string): void => {
    mutate({ email, password });
  };

  const logout = useCallback((): void => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  useEffect((): void => {
    const storedToken: string | null = localStorage.getItem(TOKEN_KEY);
    if (storedToken) setToken(storedToken);
    setIsAuthReady(true);
  }, []);

  useEffect(() => { // Handle 401
    const handleUnauthorized = (): void => logout();
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, isPending, login, logout, error, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};