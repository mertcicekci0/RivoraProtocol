// API Route: /api/limit-orders
// Handles limit order operations
// ❌ 1inch SDK removed - placeholder implementation

import type { NextApiRequest, NextApiResponse } from 'next';
// ❌ REMOVED: import { createLimitOrder } from '../../lib/server/limit-order-sdk';

interface CreateOrderRequest {
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  maker: string;
  chainId: number;
  makerDecimals: number;
  takerDecimals: number;
}

interface LimitOrderResponse {
  success: boolean;
  orderData?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LimitOrderResponse>
) {
  if (req.method === 'POST') {
    try {
      const {
        makerAsset,
        takerAsset,
        makingAmount,
        takingAmount,
        maker,
        chainId,
      }: CreateOrderRequest = req.body;

      // Validate required fields
      if (!makerAsset || !takerAsset || !makingAmount || !takingAmount || !maker) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(maker)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format',
        });
      }

      // ❌ REMOVED: 1inch limit order creation
      // TODO: Replace with Stellar DEX offers or Path Payments
      console.log('⚠️ 1inch limit order SDK removed - returning placeholder');

      return res.status(200).json({
        success: false,
        error: 'Limit orders temporarily unavailable - migrating to Stellar',
      });

    } catch (error) {
      console.error('❌ Failed to create limit order:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create limit order',
      });
    }
  }

  // Handle GET requests - fetch user's orders
  if (req.method === 'GET') {
    try {
      const { walletAddress, chainId, type = 'active' } = req.query;

      if (!walletAddress || !chainId) {
        return res.status(400).json({
          success: false,
          error: 'Missing walletAddress or chainId',
        });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format',
        });
      }

      // ❌ REMOVED: 1inch order fetching
      // TODO: Replace with Stellar DEX offers
      console.log('⚠️ 1inch API removed - returning empty orders');

      return res.status(200).json({
        success: true,
        data: {
          orders: [],
        },
      });

    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  }

  // Handle DELETE requests - cancel order
  if (req.method === 'DELETE') {
    try {
      const { orderHash, chainId } = req.body;

      if (!orderHash || !chainId) {
        return res.status(400).json({
          success: false,
          error: 'Missing orderHash or chainId',
        });
      }

      // ❌ REMOVED: 1inch order cancellation
      // TODO: Replace with Stellar DEX offer cancellation
      console.log('⚠️ 1inch API removed - order cancellation unavailable');

      return res.status(200).json({
        success: false,
        error: 'Order cancellation temporarily unavailable',
      });

    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel order',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}