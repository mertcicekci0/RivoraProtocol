'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StellarWalletProvider } from '@/lib/providers/StellarWalletProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StellarWalletProvider>
        {children}
      </StellarWalletProvider>
    </QueryClientProvider>
  );
}
