// Public API: Get Rivora scores for a wallet
// GET /api/v1/score/[walletAddress]
// Public endpoint for DeFi protocols and lending platforms

import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidStellarPublicKey } from '../../../../lib/server/stellar-service';

interface PublicScoreResponse {
  success: boolean;
  walletAddress: string;
  scores: {
    trustRating: number; // 0-100
    healthScore: number; // 0-100
    userType: string;
    timestamp: string;
  };
  metadata?: {
    dataQuality: string;
    version: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicScoreResponse>
) {
  // Enable CORS for public API access
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
      scores: {
        trustRating: 0,
        healthScore: 0,
        userType: 'unknown',
        timestamp: new Date().toISOString(),
      },
      error: 'Method not allowed. Use GET.',
    });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        walletAddress: '',
        scores: {
          trustRating: 0,
          healthScore: 0,
          userType: 'unknown',
          timestamp: new Date().toISOString(),
        },
        error: 'Missing or invalid walletAddress parameter',
      });
    }

    if (!isValidStellarPublicKey(walletAddress)) {
      return res.status(400).json({
        success: false,
        walletAddress,
        scores: {
          trustRating: 0,
          healthScore: 0,
          userType: 'unknown',
          timestamp: new Date().toISOString(),
        },
        error: 'Invalid Stellar wallet address format',
      });
    }

    // Call internal calculate-scores API
    const scoresResponse = await fetch(
      `${req.headers.origin || 'http://localhost:3000'}/api/calculate-scores`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      }
    );

    if (!scoresResponse.ok) {
      const errorData = await scoresResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to calculate scores');
    }

    const scoresData = await scoresResponse.json();

    // Return public API response
    return res.status(200).json({
      success: true,
      walletAddress,
      scores: {
        trustRating: Math.round(scoresData.deFiRiskScore * 100) / 100,
        healthScore: Math.round(scoresData.deFiHealthScore * 100) / 100,
        userType: scoresData.userType,
        timestamp: scoresData.metadata?.timestamp || new Date().toISOString(),
      },
      metadata: {
        dataQuality: scoresData.metadata?.dataQuality || 'unknown',
        version: '1.0.0',
      },
    });

  } catch (error: any) {
    console.error('❌ Public API error:', error);
    return res.status(500).json({
      success: false,
      walletAddress: (req.query.walletAddress as string) || '',
      scores: {
        trustRating: 0,
        healthScore: 0,
        userType: 'unknown',
        timestamp: new Date().toISOString(),
      },
      error: error.message || 'Internal server error',
    });
  }
}

