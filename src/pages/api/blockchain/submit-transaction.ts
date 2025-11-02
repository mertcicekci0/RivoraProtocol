// API Endpoint: Submit signed transaction to Stellar network
// POST /api/blockchain/submit-transaction

import type { NextApiRequest, NextApiResponse } from 'next';
import { Server, Transaction, Networks } from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org';
const TESTNET_HORIZON_URL = process.env.STELLAR_TESTNET_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'mainnet' | 'testnet';

const horizonServer = new Server(
  NETWORK === 'testnet' ? TESTNET_HORIZON_URL : HORIZON_URL
);

interface SubmitTransactionRequest {
  xdr: string;
  network: string;
}

interface SubmitTransactionResponse {
  success: boolean;
  transactionHash?: string;
  ledger?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitTransactionResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { xdr, network }: SubmitTransactionRequest = req.body;

    if (!xdr) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing transaction XDR' 
      });
    }

    // Reconstruct transaction from XDR
    const networkPassphrase = network === 'testnet' 
      ? Networks.TESTNET 
      : Networks.PUBLIC;

    const transaction = new Transaction(xdr, networkPassphrase);

    console.log(`📤 Submitting transaction to ${network}...`);

    // Submit to network
    const result = await horizonServer.submitTransaction(transaction);

    console.log(`✅ Transaction submitted: ${result.hash}`);

    return res.status(200).json({
      success: true,
      transactionHash: result.hash,
      ledger: result.ledger,
    });

  } catch (error: any) {
    console.error('❌ Error submitting transaction:', error);
    
    // Extract more detailed error message
    let errorMessage = 'Failed to submit transaction';
    if (error?.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      errorMessage = `Transaction failed: ${codes.transaction || 'Unknown error'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

