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

export function useScores() {
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

    const fetchScores = async (walletAddress: string) => {
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
      
      // Auto-save to blockchain if 24 hours passed and scores changed
      if (walletAddress && data) {
        checkAndAutoSaveToBlockchain(walletAddress, data);
      }
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
      fetchScores(address);
    }
  };

  // Auto-fetch when wallet connects or changes
  useEffect(() => {
    if (address && isConnected) {
      fetchScores(address);
    } else {
      // Reset state when wallet disconnects
      setState({
        data: null,
        loading: false,
        error: null,
      });
    }
  }, [address, isConnected]);

  // Auto-save to blockchain if conditions are met
  useEffect(() => {
    if (address && isConnected && state.data) {
      // This will be handled in fetchScores after data is set
      // Separate useEffect to avoid double checking
    }
  }, [address, isConnected, state.data]);

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
/**
 * Check if scores should be auto-saved to blockchain
 * Saves if 24 hours passed and scores changed
 */
async function checkAndAutoSaveToBlockchain(
  walletAddress: string,
  currentScores: ScoreData
): Promise<void> {
  try {
    const STORAGE_KEY = `rivora_last_save_${walletAddress}`;
    const SCORES_KEY = `rivora_last_scores_${walletAddress}`;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Get last save time and scores from localStorage
    const lastSaveTimeStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const lastScoresStr = typeof window !== 'undefined' ? localStorage.getItem(SCORES_KEY) : null;

    const now = Date.now();
    const lastSaveTime = lastSaveTimeStr ? parseInt(lastSaveTimeStr, 10) : 0;
    const timeSinceLastSave = now - lastSaveTime;

    // Check if 24 hours passed
    if (timeSinceLastSave < TWENTY_FOUR_HOURS) {
      console.log(`⏳ Auto-save skipped: ${Math.round((TWENTY_FOUR_HOURS - timeSinceLastSave) / (60 * 60 * 1000))} hours remaining`);
      return;
    }

    // Check if scores changed
    let scoresChanged = true;
    if (lastScoresStr) {
      try {
        const lastScores = JSON.parse(lastScoresStr);
        const scoreThreshold = 0.01; // Consider scores changed if difference > 1%
        
        const riskDiff = Math.abs(currentScores.deFiRiskScore - (lastScores.deFiRiskScore || 0));
        const healthDiff = Math.abs(currentScores.deFiHealthScore - (lastScores.deFiHealthScore || 0));
        
        scoresChanged = riskDiff > scoreThreshold || healthDiff > scoreThreshold;
        
        if (!scoresChanged) {
          console.log('⏳ Auto-save skipped: Scores unchanged');
          // Update last save time even if scores didn't change (to reset 24h timer)
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, now.toString());
          }
          return;
        }
      } catch (e) {
        console.warn('Failed to parse last scores, proceeding with save');
      }
    }

    // Scores changed and 24 hours passed - auto-save to blockchain
    console.log('💾 Auto-saving scores to blockchain...');
    
    const response = await fetch('/api/blockchain/auto-save-scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        trustRating: currentScores.deFiRiskScore,
        healthScore: currentScores.deFiHealthScore,
        userType: currentScores.userType,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.xdr) {
      // Sign and submit transaction using Freighter
      try {
        const { default: freighterApi } = await import('@stellar/freighter-api');
        
        const network = result.network === 'testnet' ? 'TESTNET' : 'PUBLIC';
        
        // Attempt to sign transaction with Freighter
        // This will show a popup if user needs to approve
        const signedXdr = await freighterApi.signTransaction(result.xdr, {
          network,
        });

        if (!signedXdr) {
          throw new Error('Transaction signing was cancelled');
        }

        // Submit signed transaction
        const submitResponse = await fetch('/api/blockchain/submit-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            xdr: signedXdr,
            network: result.network,
          }),
        });

        const submitResult = await submitResponse.json();

        if (submitResult.success) {
          console.log('✅ Auto-saved to blockchain:', submitResult.transactionHash || 'Success');
          
          // Update localStorage with new save time and scores
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, now.toString());
            localStorage.setItem(SCORES_KEY, JSON.stringify({
              deFiRiskScore: currentScores.deFiRiskScore,
              deFiHealthScore: currentScores.deFiHealthScore,
              userType: currentScores.userType,
            }));
          }
        } else {
          throw new Error(submitResult.error || 'Transaction submission failed');
        }
      } catch (signError: any) {
        // If signing fails (e.g., Freighter not available or user rejected), 
        // log but don't fail - this is background operation
        console.warn('⚠️ Auto-save signing failed (background operation):', signError.message);
        // Don't update localStorage - will retry next time
      }
    } else {
      throw new Error(result.error || 'Auto-save failed');
    }

  } catch (error) {
    console.error('❌ Auto-save to blockchain failed:', error);
    // Don't throw - this is background operation, shouldn't block UI
  }
}

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
