// Public API: Batch score lookup
// POST /api/v1/batch-scores
// Get scores for multiple wallets at once

import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidStellarPublicKey } from '../../../lib/server/stellar-service';

interface BatchScoresRequest {
  walletAddresses: string[];
}

interface BatchScoresResponse {
  success: boolean;
  results: Array<{
    walletAddress: string;
    scores?: {
      trustRating: number;
      healthScore: number;
      userType: string;
      timestamp: string;
    };
    error?: string;
  }>;
  metadata: {
    total: number;
    successful: number;
    failed: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BatchScoresResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      results: [],
      metadata: { total: 0, successful: 0, failed: 0 },
    });
  }

  try {
    const { walletAddresses }: BatchScoresRequest = req.body;

    if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
      return res.status(400).json({
        success: false,
        results: [],
        metadata: { total: 0, successful: 0, failed: 0 },
      });
    }

    // Limit batch size to prevent abuse
    if (walletAddresses.length > 50) {
      return res.status(400).json({
        success: false,
        results: [],
        metadata: { total: 0, successful: 0, failed: 0 },
      });
    }

    const results = await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        try {
          if (!isValidStellarPublicKey(walletAddress)) {
            return {
              walletAddress,
              error: 'Invalid wallet address format',
            };
          }

          // Call internal API
          const scoresResponse = await fetch(
            `${req.headers.origin || 'http://localhost:3000'}/api/calculate-scores`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress }),
            }
          );

          if (!scoresResponse.ok) {
            return {
              walletAddress,
              error: 'Failed to calculate scores',
            };
          }

          const scoresData = await scoresResponse.json();

          return {
            walletAddress,
            scores: {
              trustRating: Math.round(scoresData.deFiRiskScore * 100) / 100,
              healthScore: Math.round(scoresData.deFiHealthScore * 100) / 100,
              userType: scoresData.userType,
              timestamp: scoresData.metadata?.timestamp || new Date().toISOString(),
            },
          };
        } catch (error: any) {
          return {
            walletAddress,
            error: error.message || 'Unknown error',
          };
        }
      })
    );

    const successful = results.filter((r) => r.scores).length;
    const failed = results.filter((r) => r.error).length;

    return res.status(200).json({
      success: true,
      results,
      metadata: {
        total: walletAddresses.length,
        successful,
        failed,
      },
    });

  } catch (error: any) {
    console.error('❌ Batch scores API error:', error);
    return res.status(500).json({
      success: false,
      results: [],
      metadata: { total: 0, successful: 0, failed: 0 },
    });
  }
}

