// Public API: Verify if a wallet has scores saved on blockchain
// GET /api/v1/verify/{walletAddress}

import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidStellarPublicKey } from '../../../lib/server/stellar-service';
import { readScoresFromBlockchain } from '../../../lib/server/blockchain-service';

interface VerifyResponse {
  success: boolean;
  walletAddress: string;
  hasOnChainScores: boolean;
  scores?: {
    trustRating: number;
    healthScore: number;
    userType: string;
    timestamp: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      walletAddress: '',
      hasOnChainScores: false,
      error: 'Method not allowed. Use GET.',
    });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        walletAddress: '',
        hasOnChainScores: false,
        error: 'Missing or invalid walletAddress parameter',
      });
    }

    if (!isValidStellarPublicKey(walletAddress)) {
      return res.status(400).json({
        success: false,
        walletAddress,
        hasOnChainScores: false,
        error: 'Invalid Stellar wallet address format',
      });
    }

    // Check if scores exist on blockchain
    const blockchainScores = await readScoresFromBlockchain(walletAddress);

    if (blockchainScores) {
      return res.status(200).json({
        success: true,
        walletAddress,
        hasOnChainScores: true,
        scores: {
          trustRating: blockchainScores.trustRating,
          healthScore: blockchainScores.healthScore,
          userType: blockchainScores.userType,
          timestamp: blockchainScores.timestamp,
        },
      });
    }

    return res.status(200).json({
      success: true,
      walletAddress,
      hasOnChainScores: false,
    });

  } catch (error: any) {
    console.error('❌ Verify API error:', error);
    return res.status(500).json({
      success: false,
      walletAddress: (req.query.walletAddress as string) || '',
      hasOnChainScores: false,
      error: error.message || 'Internal server error',
    });
  }
}

