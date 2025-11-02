// API Endpoint: Auto-save scores to Stellar blockchain (background operation)
// POST /api/blockchain/auto-save-scores
// This endpoint automatically saves scores without requiring user interaction

import type { NextApiRequest, NextApiResponse } from 'next';
import { saveScoresToBlockchain } from '../../../lib/server/blockchain-service';
import { isValidStellarPublicKey } from '../../../lib/server/stellar-service';

interface AutoSaveScoresRequest {
  walletAddress: string;
  trustRating: number;
  healthScore: number;
  userType: string;
}

interface AutoSaveScoresResponse {
  success: boolean;
  transactionHash?: string;
  ledger?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoSaveScoresResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { walletAddress, trustRating, healthScore, userType }: AutoSaveScoresRequest = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing walletAddress' 
      });
    }

    if (!isValidStellarPublicKey(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Stellar wallet address' 
      });
    }

    if (trustRating === undefined || healthScore === undefined || !userType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: trustRating, healthScore, userType' 
      });
    }

    console.log(`💾 Auto-saving scores to blockchain for: ${walletAddress}`);

    // Create transaction XDR (will use Soroban if configured, otherwise Data Entry)
    // Frontend will sign this with Freighter automatically
    const { createSaveScoresTransaction } = await import('../../../lib/server/blockchain-service');
    
    const { xdr, network } = await createSaveScoresTransaction(walletAddress, {
      trustRating,
      healthScore,
      userType,
    });

    // Return transaction XDR - frontend will handle signing
    return res.status(200).json({
      success: true,
      xdr,
      network,
      // Note: Transaction will be signed by frontend using Freighter
    });

  } catch (error: any) {
    console.error('❌ Error in auto-save:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-save scores',
    });
  }
}

