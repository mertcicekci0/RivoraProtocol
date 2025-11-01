// API Route: /api/tokens/balances
// Get Stellar account balances

import type { NextApiRequest, NextApiResponse } from 'next';
import { getStellarAccount, isValidStellarPublicKey } from '../../../lib/server/stellar-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing walletAddress (Stellar public key)',
      });
    }

    // Validate Stellar public key format
    if (!isValidStellarPublicKey(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid Stellar public key format',
      });
    }

    // Fetch Stellar account data
    const account = await getStellarAccount(walletAddress);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found on Stellar network',
      });
    }

    // Format balances response
    const formattedBalances: { [key: string]: string } = {};
    
    account.balances.forEach(balance => {
      const key = balance.assetType === 'native' 
        ? 'XLM' 
        : `${balance.assetCode}_${balance.assetIssuer}`;
      formattedBalances[key] = balance.balance;
    });

    return res.status(200).json(formattedBalances);

  } catch (error) {
    console.error('❌ Failed to get balances:', error);
    return res.status(500).json({
      error: 'Failed to fetch balances',
    });
  }
}
