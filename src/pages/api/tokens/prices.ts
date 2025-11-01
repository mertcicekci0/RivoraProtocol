// API Route: /api/tokens/prices
// Get real-time token prices

import type { NextApiRequest, NextApiResponse } from 'next';
// ❌ REMOVED: import { getTokenPrices } from '../../../lib/server/oneinch-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { addresses, chainId = 1 } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({
        error: 'Missing or invalid addresses',
      });
    }

    // ❌ REMOVED: 1inch API call
    // TODO: Replace with Stellar asset price API
    console.log('⚠️ 1inch API removed - returning zero prices');
    
    const formattedPrices: { [address: string]: { price: number; priceChange24h: number } } = {};
    addresses.forEach((address: string) => {
      formattedPrices[address] = {
        price: 0,
        priceChange24h: 0,
      };
    });

    return res.status(200).json(formattedPrices);

  } catch (error) {
    console.error('❌ Failed to get prices:', error);
    return res.status(500).json({
      error: 'Failed to fetch prices',
    });
  }
}
