// Custom hook for Freighter wallet integration
'use client'

import { useState, useEffect, useCallback } from 'react';

interface StellarAccount {
  publicKey: string;
  displayName: string;
  isConnected: boolean;
}

export function useStellarWallet() {
  const [account, setAccount] = useState<StellarAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);

  // Check if Freighter is installed and available
  const isFreighterAvailable = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      // Check if @stellar/freighter-api is available
      const { default: freighterApi } = await import('@stellar/freighter-api');
      return freighterApi !== undefined;
    } catch {
      return false;
    }
  }, []);

  // Connect to Freighter wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setIsManuallyDisconnected(false); // Reset manual disconnect flag

    try {
      // Check if Freighter is available
      const available = await isFreighterAvailable();
      if (!available) {
        throw new Error('Freighter wallet is not installed. Please install Freighter extension to continue.');
      }

      // Import freighter API dynamically
      const { default: freighterApi } = await import('@stellar/freighter-api');
      
      // Request connection - getPublicKey will prompt user if not connected
      const publicKey = await freighterApi.getPublicKey();
      
      if (!publicKey) {
        throw new Error('Failed to get public key from Freighter. User may have rejected the connection.');
      }

      setAccount({
        publicKey,
        displayName: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
        isConnected: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Freighter wallet';
      setError(errorMessage);
      console.error('Freighter connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isFreighterAvailable]);

  // Disconnect from Freighter wallet
  const disconnect = useCallback(async () => {
    try {
      // Try to disconnect from Freighter if available
      const { default: freighterApi } = await import('@stellar/freighter-api');
      // Freighter doesn't have a disconnect method, so we just clear local state
      // The connection will remain in Freighter but our app will forget it
    } catch (err) {
      // Ignore errors if Freighter is not available
    }
    
    // Set manual disconnect flag to prevent auto-reconnect
    setIsManuallyDisconnected(true);
    
    // Clear local state - this will trigger re-render and show landing page
    setAccount(null);
    setError(null);
  }, []);

  // Get current account info
  const getAccount = useCallback(async () => {
    // Don't auto-reconnect if user manually disconnected
    if (isManuallyDisconnected) {
      return;
    }

    try {
      const { default: freighterApi } = await import('@stellar/freighter-api');
      const isConnected = await freighterApi.isConnected();
      
      if (isConnected) {
        const publicKey = await freighterApi.getPublicKey();
        if (publicKey) {
          setAccount({
            publicKey,
            displayName: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
            isConnected: true,
          });
        }
      }
    } catch (err) {
      console.error('Error getting account:', err);
    }
  }, [isManuallyDisconnected]);

  // Check connection status on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check if already connected (only if not manually disconnected)
    if (typeof window !== 'undefined' && !isManuallyDisconnected) {
      getAccount();
    }
  }, [getAccount, isManuallyDisconnected]);

  return {
    account,
    isConnected: account?.isConnected || false,
    isConnecting,
    error,
    isMounted,
    connect,
    disconnect,
    isFreighterAvailable,
  };
}

