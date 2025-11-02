// Public API: Service status endpoint
// GET /api/v1/status

import type { NextApiRequest, NextApiResponse } from 'next';

interface StatusResponse {
  status: 'operational' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  services: {
    scoring: 'operational' | 'degraded';
    blockchain: 'operational' | 'degraded';
    api: 'operational' | 'degraded';
  };
  stats?: {
    totalWalletsScored?: number;
    averageResponseTime?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const status: StatusResponse = {
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      scoring: 'operational',
      blockchain: 'operational',
      api: 'operational',
    },
  };

  return res.status(200).json(status);
}

