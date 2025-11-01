// Custom hook for fetching scores from our API
// ❌ UPDATED: Removed wagmi useAccount
'use client'

import { useState, useEffect } from 'react';
import { useStellarWallet } from './useStellarWallet';

export interface ScoreData {
  deFiRiskScore: number;
  deFiHealthScore: number;
  userType: string;
  userTypeScore?: number;
  metadata?: {
    dataQuality: 'high' | 'medium' | 'low';
    analyzedMetrics: string[];
    timestamp: string;
  };
  // Optional additional analysis data
  analysis?: {
    transactionFrequency?: number;
    secureSwapUsage?: number;
    portfolioDiversity?: number;
    portfolioConcentration?: number;
    portfolioVolatility?: number;
    gasEfficiency?: number;
  };
  // Optional portfolio data for visualization
  portfolioData?: {
    totalValue?: number;
    tokens?: Array<{
      symbol: string;
      amount: string;
      price: string;
      value: number;
      percentage: number;
    }>;
  };
}

export interface ScoreState {
  data: ScoreData | null;
  loading: boolean;
  error: string | null;
}

export function useScores(chainId: number = 1) {
  const { account, isConnected } = useStellarWallet();
  const address = account?.publicKey || null;
  const [state, setState] = useState<ScoreState>({
    data: null,
    loading: false,
    error: null,
  });

  // Debounce to prevent excessive API calls - INCREASED for rate limiting compliance
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN = 60000; // 60 seconds cooldown (increased from 30s for aggressive rate limiting)

    const fetchScores = async (walletAddress: string, targetChainId: number) => {
    // Check cooldown to prevent spam
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      console.log('⏳ Skipping fetch due to cooldown');
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastFetchTime(now);

    try {
      const response = await fetch('/api/calculate-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          chainId: targetChainId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setState({
        data,
        loading: false,
        error: null,
      });

      console.log('✅ Scores fetched successfully:', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch scores';
      console.error('❌ Score fetch failed:', errorMessage);
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  };

  const refetch = () => {
    if (address && isConnected) {
      // Reset cooldown for manual refetch
      setLastFetchTime(0);
      fetchScores(address, chainId);
    }
  };

  // Auto-fetch when wallet connects or changes
  useEffect(() => {
    if (address && isConnected) {
      fetchScores(address, chainId);
    } else {
      // Reset state when wallet disconnects
      setState({
        data: null,
        loading: false,
        error: null,
      });
    }
  }, [address, isConnected, chainId]);

  return {
    ...state,
    refetch,
    isConnected,
    walletAddress: address,
  };
}

// Risk score classification helper
export function getRiskLevel(score: number): {
  level: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  color: string;
  bgColor: string;
} {
  if (score >= 80) return { level: 'Very Low', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  if (score >= 60) return { level: 'Low', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  if (score >= 40) return { level: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
  if (score >= 20) return { level: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
  return { level: 'Very High', color: 'text-red-400', bgColor: 'bg-red-500/20' };
}

// Health score classification helper
export function getHealthLevel(score: number): {
  level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  color: string;
  bgColor: string;
} {
  if (score >= 80) return { level: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  if (score >= 60) return { level: 'Good', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  if (score >= 40) return { level: 'Fair', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
  if (score >= 20) return { level: 'Poor', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
  return { level: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/20' };
}

// User type display helpers
export function getUserTypeInfo(userType: string): {
  description: string;
  emoji: string;
  color: string;
} {
  switch (userType) {
    case 'Trader':
      return {
        description: 'Active trader focused on price optimization',
        emoji: '📈',
        color: 'text-green-400'
      };
    case 'Explorer':
      return {
        description: 'Experimental user trying new tokens',
        emoji: '🔍',
        color: 'text-purple-400'
      };
    case 'Optimizer':
      return {
        description: 'Efficiency-focused with limit orders',
        emoji: '⚡',
        color: 'text-blue-400'
      };
    case 'Passive':
      return {
        description: 'Long-term holder with minimal activity',
        emoji: '🏛️',
        color: 'text-gray-400'
      };
    default:
      return {
        description: 'Unknown user type',
        emoji: '❓',
        color: 'text-gray-400'
      };
  }
}
