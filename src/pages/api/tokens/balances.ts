// API Route: /api/tokens/balances
// Get user token balances

import type { NextApiRequest, NextApiResponse } from 'next';
// ❌ REMOVED: import { getWalletBalances } from '../../../lib/server/oneinch-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, tokenAddresses, chainId = 1 } = req.body;

    if (!walletAddress || !tokenAddresses) {
      return res.status(400).json({
        error: 'Missing walletAddress or tokenAddresses',
      });
    }

    // ❌ REMOVED: 1inch API call
    // TODO: Replace with Stellar account balances API
    console.log('⚠️ 1inch API removed - returning empty balances');
    
    // Return zeros for all requested tokens
    const formattedBalances: { [address: string]: string } = {};
    tokenAddresses.forEach((address: string) => {
      formattedBalances[address] = '0';
    });

    return res.status(200).json(formattedBalances);

  } catch (error) {
    console.error('❌ Failed to get balances:', error);
    return res.status(500).json({
      error: 'Failed to fetch balances',
    });
  }
}
