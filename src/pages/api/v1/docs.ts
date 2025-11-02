// Public API: Documentation endpoint
// GET /api/v1/docs

import type { NextApiRequest, NextApiResponse } from 'next';

interface DocsResponse {
  name: string;
  version: string;
  description: string;
  endpoints: Array<{
    path: string;
    method: string;
    description: string;
    parameters?: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    response: {
      example: any;
    };
  }>;
  useCases: string[];
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DocsResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const docs: DocsResponse = {
    name: 'Rivora Protocol API',
    version: '1.0.0',
    description: 'Public API for accessing Rivora Trust Ratings and Health Scores. Enables DeFi protocols and lending platforms to assess wallet credibility on Stellar network.',
    endpoints: [
      {
        path: '/api/v1/score/{walletAddress}',
        method: 'GET',
        description: 'Get Rivora scores for a Stellar wallet address',
        parameters: [
          {
            name: 'walletAddress',
            type: 'string',
            required: true,
            description: 'Stellar public key (G...), 56 characters',
          },
        ],
        response: {
          example: {
            success: true,
            walletAddress: 'GABCDEF...',
            scores: {
              trustRating: 85.5,
              healthScore: 72.3,
              userType: 'Trader',
              timestamp: '2025-11-02T12:00:00.000Z',
            },
            metadata: {
              dataQuality: 'high',
              version: '1.0.0',
            },
          },
        },
      },
    ],
    useCases: [
      'Lending platforms can use Trust Rating to determine loan eligibility and interest rates',
      'DeFi protocols can adjust fees based on wallet credibility',
      'DEX aggregators can prioritize orders from trusted wallets',
      'Yield farming protocols can offer better APY to verified users',
      'Cross-protocol reputation system for Stellar ecosystem',
    ],
  };

  return res.status(200).json(docs);
}

