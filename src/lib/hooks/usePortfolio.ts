// Custom hook for portfolio data
// ❌ UPDATED: Removed 1inch API references, removed wagmi useAccount
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useStellarWallet } from './useStellarWallet';

export interface TokenHolding {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  balanceUSD: number;
  price: number;
  priceChange24h: number;
  percentage: number;
  decimals: number;
}

export interface PortfolioData {
  totalValue: number;
  totalChange24h: number;
  tokens: TokenHolding[];
  lastUpdated: string;
}

export interface PortfolioState {
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
}

export function usePortfolio() {
  const { account, isConnected } = useStellarWallet();
  const address = account?.publicKey || null;
  const [state, setState] = useState<PortfolioState>({
    data: null,
    loading: false,
    error: null,
  });

  // Debounce to prevent excessive API calls
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN = 60000; // 1 minute cooldown

  const fetchPortfolio = useCallback(async (walletAddress: string) => {
    // Check cooldown to prevent spam
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      console.log('⏳ Skipping portfolio fetch due to cooldown');
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastFetchTime(now);

    try {
      // Use our backend API to get portfolio data
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const portfolioData = await response.json();
      setState({
        data: portfolioData,
        loading: false,
        error: null,
      });

      console.log('✅ Portfolio data fetched successfully:', portfolioData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolio';
      console.error('❌ Portfolio fetch failed:', errorMessage);
      
      // Show actual error instead of fallback mock data
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [lastFetchTime]);

  const refetch = () => {
    if (address && isConnected) {
      // Reset cooldown for manual refetch
      setLastFetchTime(0);
      fetchPortfolio(address);
    }
  };

  // Auto-fetch when wallet connects or changes
  useEffect(() => {
    if (address && isConnected) {
      fetchPortfolio(address);
    } else {
      // Reset state when wallet disconnects
      setState({
        data: null,
        loading: false,
        error: null,
      });
    }
  }, [address, isConnected, fetchPortfolio]);

  return {
    ...state,
    refetch,
    isConnected,
    walletAddress: address,
  };
}

// Helper functions for portfolio calculations
export function calculatePortfolioMetrics(tokens: TokenHolding[]) {
  const totalValue = tokens.reduce((sum, token) => sum + token.balanceUSD, 0);
  const totalChange24h = tokens.reduce((sum, token) => 
    sum + (token.balanceUSD * token.priceChange24h / 100), 0
  );
  const changePercentage = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    totalValue,
    totalChange24h,
    changePercentage,
  };
}

// Generate daily performance data for charts - uses only real data
export function generatePerformanceData(tokens: TokenHolding[]): any[] {
  if (!tokens || tokens.length === 0) {
    return [];
  }

  // In a real implementation, this would fetch historical price data from 1inch APIs
  // For now, return empty array when no real historical data is available
  return [];
}

// Format currency values
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Format percentage values
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Get color for price change
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-gray-400';
}
