// API Route: /api/tokens
// Handles token information
// ❌ REMOVED: from 1inch API

import type { NextApiRequest, NextApiResponse } from 'next';
// ❌ REMOVED: import { getTokenInfo, getMultipleTokensInfo, getTokenPrices } from '../../lib/server/oneinch-service';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenPrice {
  [address: string]: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chainId, addresses, prices, type } = req.query;

    if (!chainId) {
      return res.status(400).json({ error: 'Missing chainId parameter' });
    }

    // Get popular tokens for limit orders
    if (type === 'popular') {
      // Placeholder popular tokens - will be replaced with Stellar assets
      const popularTokens = [
        {
          symbol: 'XLM',
          name: 'Stellar Lumens',
          address: 'native',
          decimals: 7,
          price: 0,
          priceChange24h: 0,
          balance: '0.0',
          balanceUSD: 0,
          logoURI: '',
        },
      ];

      return res.status(200).json({ tokens: popularTokens });
    }

    // ❌ REMOVED: Token price and info API calls
    // TODO: Replace with Stellar asset APIs
    console.log('⚠️ 1inch API removed - returning empty data');
    return res.status(200).json([]);

  } catch (error) {
    console.error('❌ Token API error:', error);
    return res.status(500).json({
      error: 'Internal server error in token API'
    });
  }
}
