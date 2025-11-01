import type { NextApiRequest, NextApiResponse } from 'next';

const POPULAR_TOKENS = [
  { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  { address: '0xA0b86a33E6B8e6B9c4b25E1e1E7d2e3F4e5e6e7e', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query: searchQuery } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Missing search query' });
    }

    const filtered = POPULAR_TOKENS.filter(token => 
      token.symbol.toLowerCase().includes(searchQuery.toString().toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toString().toLowerCase())
    );

    return res.status(200).json({ tokens: filtered });
  } catch (error) {
    return res.status(500).json({ error: 'Search failed' });
  }
}
