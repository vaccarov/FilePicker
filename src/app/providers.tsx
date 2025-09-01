'use client';

import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
import { JSX, useState } from 'react';

export function Providers({ children, ...props }: ThemeProviderProps): JSX.Element {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider {...props}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}