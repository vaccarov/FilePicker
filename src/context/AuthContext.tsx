'use client';

import { createContext, useState, useContext, ReactNode, FC, useEffect } from 'react';
import { getAuthToken } from '@/services/api';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { TOKEN_KEY } from '@/lib/constants';

interface AuthContextType {
  token: string | null;
  isPending: boolean;
  login: (password: string) => void;
  logout: () => void;
  error: Error | null;
  isAuthReady: boolean;
}

const AuthContext: React.Context<AuthContextType | undefined> = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const { mutate: login, isPending, error }: UseMutationResult<string, Error, string> = useMutation<string, Error, string>({
    mutationFn: (password: string): Promise<string> => getAuthToken(password),
    onSuccess: (data: string): void => {
      setToken(data);
      localStorage.setItem(TOKEN_KEY, data);
    },
  });

  const logout: () => void = (): void => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  useEffect((): void => {
    const storedToken: string | null = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
    setIsAuthReady(true);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isPending, login, logout, error, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};