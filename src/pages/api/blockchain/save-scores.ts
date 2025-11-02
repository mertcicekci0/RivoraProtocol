// API Endpoint: Save scores to Stellar blockchain
// POST /api/blockchain/save-scores

import type { NextApiRequest, NextApiResponse } from 'next';
import { createSaveScoresTransaction } from '../../../lib/server/blockchain-service';
import { isValidStellarPublicKey } from '../../../lib/server/stellar-service';

interface SaveScoresRequest {
  walletAddress: string;
  trustRating: number;
  healthScore: number;
  userType: string;
}

interface SaveScoresResponse {
  success: boolean;
  xdr?: string;
  network?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveScoresResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { walletAddress, trustRating, healthScore, userType }: SaveScoresRequest = req.body;

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

    console.log(`🔗 Creating blockchain transaction for: ${walletAddress}`);

    // Create transaction XDR for Freighter to sign
    const { xdr, network } = await createSaveScoresTransaction(walletAddress, {
      trustRating,
      healthScore,
      userType,
    });

    return res.status(200).json({
      success: true,
      xdr,
      network,
    });

  } catch (error: any) {
    console.error('❌ Error creating blockchain transaction:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create blockchain transaction',
    });
  }
}

