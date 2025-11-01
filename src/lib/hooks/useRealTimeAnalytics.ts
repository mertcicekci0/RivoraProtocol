// Custom hook for real-time analytics data
// ❌ UPDATED: Removed wagmi useAccount
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useStellarWallet } from './useStellarWallet';

export interface RealTimePriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: string;
}

export interface MarketSummary {
  totalMarketCap: number;
  totalVolume24h: number;
  marketChange24h: number;
}

export interface AnalyticsData {
  prices: RealTimePriceData[];
  marketSummary: MarketSummary;
  lastUpdated: string;
}

export interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

export function useRealTimeAnalytics() {
  const { isConnected } = useStellarWallet();
  const [state, setState] = useState<AnalyticsState>({
    data: null,
    loading: false,
    error: null,
  });

  // Real-time update interval (10 seconds)
  const UPDATE_INTERVAL = 10000;
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/analytics/real-time-prices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      setState({
        data: analyticsData,
        loading: false,
        error: null,
      });

      setLastFetchTime(Date.now());
      console.log('✅ Real-time analytics updated:', analyticsData.prices.length, 'tokens');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
      console.error('❌ Analytics fetch failed:', errorMessage);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const refetch = () => {
    fetchAnalytics();
  };

  // Auto-fetch on mount and set up real-time updates
  useEffect(() => {
    if (isConnected) {
      // Initial fetch
      fetchAnalytics();

      // Set up real-time updates
      const interval = setInterval(() => {
        fetchAnalytics();
      }, UPDATE_INTERVAL);

      return () => clearInterval(interval);
    } else {
      // Reset state when wallet disconnects
      setState({
        data: null,
        loading: false,
        error: null,
      });
    }
  }, [isConnected, fetchAnalytics]);

  return {
    ...state,
    refetch,
    isConnected,
    isRealTime: true,
    updateInterval: UPDATE_INTERVAL,
  };
}

// Helper functions for analytics calculations
export function calculateMarketTrend(prices: RealTimePriceData[]): 'bullish' | 'bearish' | 'neutral' {
  const positiveChanges = prices.filter(p => p.change24h > 0).length;
  const totalPrices = prices.length;
  
  if (positiveChanges / totalPrices > 0.6) return 'bullish';
  if (positiveChanges / totalPrices < 0.4) return 'bearish';
  return 'neutral';
}

export function getTopGainers(prices: RealTimePriceData[], limit: number = 5): RealTimePriceData[] {
  return [...prices]
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, limit);
}

export function getTopLosers(prices: RealTimePriceData[], limit: number = 5): RealTimePriceData[] {
  return [...prices]
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, limit);
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatVolume(value: number): string {
  return formatMarketCap(value);
}
