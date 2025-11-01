// API Route: /api/portfolio
// Get Stellar account portfolio data

import type { NextApiRequest, NextApiResponse } from 'next';
import { getStellarPortfolioData, isValidStellarPublicKey } from '../../lib/server/stellar-service';

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
      return res.status(400).json({ error: 'Missing walletAddress (Stellar public key)' });
    }

    // Validate Stellar public key format
    if (!isValidStellarPublicKey(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid Stellar public key format. Must start with G and be 56 characters long.' 
      });
    }

    // Fetch Stellar portfolio data
    const portfolioData = await getStellarPortfolioData(walletAddress);

    if (!portfolioData) {
      return res.status(404).json({ error: 'Account not found on Stellar network' });
    }

    // Format response
    return res.status(200).json({
      totalValue: portfolioData.totalValue,
      nativeBalance: portfolioData.nativeBalance,
      assets: portfolioData.assets,
      trustlines: portfolioData.trustlines,
      accountAge: portfolioData.accountAge,
      transactionCount: portfolioData.transactions.length,
      balances: portfolioData.balances.map(b => ({
        assetType: b.assetType,
        assetCode: b.assetCode || 'XLM',
        assetIssuer: b.assetIssuer,
        balance: b.balance,
      })),
    });

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
}

