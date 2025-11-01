// Stellar Wallet Context Provider for Freighter integration
'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { useStellarWallet } from '../hooks/useStellarWallet';

interface StellarWalletContextType {
  account: {
    publicKey: string;
    displayName: string;
    isConnected: boolean;
  } | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isMounted: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isFreighterAvailable: () => Promise<boolean>;
}

const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const wallet = useStellarWallet();

  return (
    <StellarWalletContext.Provider value={wallet}>
      {children}
    </StellarWalletContext.Provider>
  );
}

// Hook to use Stellar wallet context
export function useStellarWalletContext() {
  const context = useContext(StellarWalletContext);
  if (context === undefined) {
    throw new Error('useStellarWalletContext must be used within a StellarWalletProvider');
  }
  return context;
}

