// API Route: /api/analytics/real-time-prices
// Real-time price updates for analytics dashboard

import type { NextApiRequest, NextApiResponse } from 'next';

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: string;
}

interface RealTimePricesResponse {
  prices: PriceUpdate[];
  marketSummary: {
    totalMarketCap: number;
    totalVolume24h: number;
    marketChange24h: number;
  };
  lastUpdated: string;
}

// ❌ REMOVED: 1inch API calls
// TODO: Replace with Stellar asset price API
const getRealTimePrices = async (): Promise<PriceUpdate[]> => {
  console.log('⚠️ 1inch API removed - returning empty prices');
  return [];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealTimePricesResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 Fetching real-time price updates...');
    const prices = await getRealTimePrices();

    const response: RealTimePricesResponse = {
      prices,
      marketSummary: {
        totalMarketCap: 0,
        totalVolume24h: 0,
        marketChange24h: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Set cache headers for frequent updates
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Real-time prices error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch real-time prices',
    });
  }
}
