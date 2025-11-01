// Enhanced hook for token management
// ❌ UPDATED: Removed 1inch API references, removed wagmi useAccount
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useStellarWallet } from './useStellarWallet';

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  balance: string; // User's balance
  balanceUSD: number;
}

export interface TokenState {
  tokens: Token[];
  loading: boolean;
  error: string | null;
  popularTokens: Token[];
  searchResults: Token[];
}

export function useTokens(chainId: number = 1) {
  const { account, isConnected } = useStellarWallet();
  const address = account?.publicKey || null;
  const [state, setState] = useState<TokenState>({
    tokens: [],
    loading: false,
    error: null,
    popularTokens: [],
    searchResults: [],
  });

  // Fetch popular tokens with real data
  const fetchPopularTokens = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/tokens?type=popular&chainId=${chainId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status}`);
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        popularTokens: data.tokens || [],
        tokens: data.tokens || [],
        loading: false,
      }));

    } catch (error) {
      console.error('❌ Failed to fetch popular tokens:', error);
      
      // Use fallback popular tokens for better UX
      const fallbackTokens: Token[] = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
          price: 2450.50,
          priceChange24h: 3.2,
          balance: '0',
          balanceUSD: 0,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86a33E6B8e6B9c4b25E1e1E7d2e3F4e5e6e7e',
          decimals: 6,
          logoURI: 'https://tokens.1inch.io/0xa0b86a33e6b8e6b9c4b25e1e1e7d2e3f4e5e6e7e.png',
          price: 1.00,
          priceChange24h: 0.1,
          balance: '0',
          balanceUSD: 0,
        },
        {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
          price: 2450.50,
          priceChange24h: 3.2,
          balance: '0',
          balanceUSD: 0,
        },
        {
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          price: 1.00,
          priceChange24h: -0.05,
          balance: '0',
          balanceUSD: 0,
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
          logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
          price: 1.00,
          priceChange24h: 0.02,
          balance: '0',
          balanceUSD: 0,
        },
      ];

      setState(prev => ({
        ...prev,
        popularTokens: fallbackTokens,
        tokens: fallbackTokens,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tokens',
      }));
    }
  }, [chainId]);

  // Fetch user balances for tokens
  const fetchUserBalances = useCallback(async (tokenAddresses: string[]) => {
    if (!address || !isConnected) return;

    try {
      const response = await fetch('/api/tokens/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          tokenAddresses,
          chainId,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch balances');

      const balances = await response.json();
      
      // Update tokens with balance data
      setState(prev => ({
        ...prev,
        tokens: prev.tokens.map(token => {
          const balance = balances[token.address] || '0';
          const balanceFormatted = formatTokenBalance(balance, token.decimals);
          return {
            ...token,
            balance: balanceFormatted,
            balanceUSD: parseFloat(balanceFormatted) * token.price,
          };
        }),
      }));

    } catch (error) {
      console.error('❌ Failed to fetch user balances:', error);
    }
  }, [address, isConnected, chainId]);

  // Search tokens by symbol or name
  const searchTokens = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, searchResults: [] }));
      return;
    }

    try {
      const response = await fetch(`/api/tokens/search?query=${encodeURIComponent(query)}&chainId=${chainId}`);
      
      if (!response.ok) throw new Error('Failed to search tokens');

      const data = await response.json();
      setState(prev => ({ ...prev, searchResults: data.tokens || [] }));

    } catch (error) {
      console.error('❌ Failed to search tokens:', error);
      setState(prev => ({ ...prev, searchResults: [] }));
    }
  }, [chainId]);

  // Refresh balances for current tokens
  const refreshBalances = useCallback(async () => {
    if (state.tokens.length > 0) {
      const tokenAddresses = state.tokens.map(t => t.address);
      await fetchUserBalances(tokenAddresses);
    }
  }, [state.tokens, fetchUserBalances]);

  // Auto-fetch popular tokens on mount
  useEffect(() => {
    fetchPopularTokens();
  }, [fetchPopularTokens]);

  // Auto-fetch balances when wallet connects
  useEffect(() => {
    if (address && isConnected && state.tokens.length > 0) {
      const tokenAddresses = state.tokens.map(t => t.address);
      fetchUserBalances(tokenAddresses);
    }
  }, [address, isConnected, state.tokens, fetchUserBalances]);

  return {
    ...state,
    searchTokens,
    refreshBalances,
    fetchPopularTokens,
  };
}

// Helper function to format token balance
function formatTokenBalance(balance: string, decimals: number): string {
  try {
    const balanceBig = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integer = balanceBig / divisor;
    const remainder = balanceBig % divisor;
    
    if (remainder === BigInt(0)) {
      return integer.toString();
    }
    
    const decimal = remainder.toString().padStart(decimals, '0');
    const trimmed = decimal.replace(/0+$/, '');
    return trimmed ? `${integer}.${trimmed}` : integer.toString();
  } catch {
    return '0';
  }
}

// Get token by address
export function getTokenByAddress(tokens: Token[], address: string): Token | undefined {
  return tokens.find(token => token.address.toLowerCase() === address.toLowerCase());
}

// Format price with appropriate decimals
export function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString()}`;
}

// Format price change with sign and color
export function formatPriceChange(change: number): {
  formatted: string;
  color: string;
  isPositive: boolean;
} {
  const isPositive = change >= 0;
  const formatted = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  
  return { formatted, color, isPositive };
}
