// Blockchain Service - Store Rivora scores on Stellar blockchain
// Supports both Data Entry (native) and Soroban smart contract storage

import { 
  Keypair, 
  TransactionBuilder, 
  Operation,
  Networks,
  BASE_FEE,
  Account,
} from '@stellar/stellar-sdk';
import { Horizon } from '@stellar/stellar-sdk';
import { 
  createSaveScoresSorobanTransaction, 
  readScoresFromSoroban 
} from './soroban-service';

// Stellar network configuration
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org';
const TESTNET_HORIZON_URL = process.env.STELLAR_TESTNET_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'mainnet' | 'testnet';

const horizonServer = new Horizon.Server(
  NETWORK === 'testnet' ? TESTNET_HORIZON_URL : HORIZON_URL
);

// Storage method preference: 'soroban' (smart contract) or 'data-entry' (native)
const STORAGE_METHOD = (process.env.BLOCKCHAIN_STORAGE_METHOD || 'data-entry') as 'soroban' | 'data-entry';
const USE_SOROBAN = STORAGE_METHOD === 'soroban' && !!process.env.SOROBAN_CONTRACT_ID;

export interface BlockchainScoreData {
  walletAddress: string;
  trustRating: number; // deFiRiskScore
  healthScore: number;
  userType: string;
  timestamp: string;
  version: string; // Contract version
}

export interface SaveScoresResult {
  success: boolean;
  transactionHash?: string;
  ledger?: number;
  error?: string;
}

/**
 * Save Rivora scores to Stellar blockchain using Data Entry
 * Data is stored in account's data entries (key-value pairs)
 * 
 * @param walletAddress Stellar public key (must sign the transaction)
 * @param scores Score data to save
 * @param secretKey Secret key for signing (from Freighter or user input)
 * @returns Transaction result
 */
export async function saveScoresToBlockchain(
  walletAddress: string,
  scores: {
    trustRating: number;
    healthScore: number;
    userType: string;
  },
  secretKey?: string // Optional, if not provided, transaction must be signed by Freighter
): Promise<SaveScoresResult> {
  try {
    // Validate wallet address
    if (!walletAddress || walletAddress.length !== 56 || !walletAddress.startsWith('G')) {
      throw new Error('Invalid Stellar wallet address');
    }

    // Prepare data to store
    const scoreData: BlockchainScoreData = {
      walletAddress,
      trustRating: Math.round(scores.trustRating * 100) / 100, // Round to 2 decimals
      healthScore: Math.round(scores.healthScore * 100) / 100,
      userType: scores.userType,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    // Convert to JSON and encode as base64
    const dataJson = JSON.stringify(scoreData);
    
    // Stellar Data Entry has 64-byte key limit and 64-byte value limit
    // We'll store data in multiple entries with keys: rivora_scores_0, rivora_scores_1, etc.
    // Or use a single entry with key "rivora_scores" and base64 encoded value
    
    const dataKey = 'rivora_scores';
    
    // Encode data as base64 (Stellar data values must be base64)
    // But we need to be careful - values can be max 64 bytes when decoded
    // So we'll use a compressed format
    const dataValue = Buffer.from(dataJson).toString('base64');

    // Check if data value exceeds 64 bytes (when decoded)
    const decodedLength = Buffer.from(dataValue, 'base64').length;
    if (decodedLength > 64) {
      // Use multiple entries strategy
      return await saveScoresToBlockchainMultiple(walletAddress, scoreData, secretKey);
    }

    // Get account to build transaction
    const sourceAccount = await horizonServer.loadAccount(walletAddress);

    // Create manageData operation
    const manageDataOp = Operation.manageData({
      name: dataKey,
      value: dataValue,
    });

    // Build transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'testnet' 
        ? Networks.TESTNET 
        : Networks.PUBLIC,
    })
      .addOperation(manageDataOp)
      .setTimeout(30)
      .build();

    // If secret key provided, sign directly
    if (secretKey) {
      const keypair = Keypair.fromSecret(secretKey);
      transaction.sign(keypair);
      const result = await horizonServer.submitTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.hash,
        ledger: result.ledger,
      };
    }

    // Otherwise, return transaction XDR for Freighter to sign
    // This will be handled by the API endpoint
    return {
      success: false,
      error: 'Transaction must be signed by wallet (Freighter)',
    };

  } catch (error: any) {
    console.error('❌ Error saving scores to blockchain:', error);
    return {
      success: false,
      error: error.message || 'Failed to save scores to blockchain',
    };
  }
}

/**
 * Save scores using multiple data entries (if single entry too large)
 */
async function saveScoresToBlockchainMultiple(
  walletAddress: string,
  scoreData: BlockchainScoreData,
  secretKey?: string
): Promise<SaveScoresResult> {
  try {
    // Split data into chunks that fit in 64 bytes
    const dataJson = JSON.stringify(scoreData);
    const chunks: string[] = [];
    const chunkSize = 50; // Leave some margin for base64 encoding overhead
    
    for (let i = 0; i < dataJson.length; i += chunkSize) {
      chunks.push(dataJson.slice(i, i + chunkSize));
    }

    const sourceAccount = await horizonServer.loadAccount(walletAddress);
    
    const operations = chunks.map((chunk, index) => 
      Operation.manageData({
        name: `rivora_${index}`,
        value: Buffer.from(chunk).toString('base64'),
      })
    );

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE * operations.length,
      networkPassphrase: NETWORK === 'testnet' 
        ? Networks.TESTNET 
        : Networks.PUBLIC,
    });

    operations.forEach(op => transaction.addOperation(op));
    
    const builtTransaction = transaction.setTimeout(30).build();

    if (secretKey) {
      const keypair = Keypair.fromSecret(secretKey);
      builtTransaction.sign(keypair);
      const result = await horizonServer.submitTransaction(builtTransaction);
      
      return {
        success: true,
        transactionHash: result.hash,
        ledger: result.ledger,
      };
    }

    return {
      success: false,
      error: 'Transaction must be signed by wallet',
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save scores',
    };
  }
}

/**
 * Read scores from blockchain
 * Tries Soroban first if enabled, then falls back to Data Entry
 */
export async function readScoresFromBlockchain(
  walletAddress: string
): Promise<BlockchainScoreData | null> {
  try {
    // Try Soroban first if enabled
    if (USE_SOROBAN) {
      try {
        const sorobanData = await readScoresFromSoroban(walletAddress);
        if (sorobanData) {
          // Convert Soroban format to BlockchainScoreData format
          return {
            walletAddress: sorobanData.walletAddress,
            trustRating: sorobanData.trustRating,
            healthScore: sorobanData.healthScore,
            userType: sorobanData.userType,
            timestamp: new Date(sorobanData.timestamp * 1000).toISOString(),
            version: sorobanData.version,
          };
        }
      } catch (sorobanError: any) {
        console.warn('⚠️ Soroban read failed, trying Data Entry:', sorobanError.message);
        // Fall through to Data Entry
      }
    }

    // Fallback to Data Entry (native Stellar)
    // Fetch account data entries via Horizon API
    const dataEntryResponse = await horizonServer
      .accounts()
      .accountId(walletAddress)
      .data();
    
    // This returns a Map-like object with all data entries
    const rivoraScores = dataEntryResponse.get('rivora_scores');
    
    if (rivoraScores) {
      const dataValue = rivoraScores.toString();
      const dataJson = Buffer.from(dataValue, 'base64').toString('utf-8');
      return JSON.parse(dataJson) as BlockchainScoreData;
    }
    
    // Try multiple entries
    const entries: string[] = [];
    let index = 0;
    
    while (dataEntryResponse.get(`rivora_${index}`)) {
      const chunkValue = dataEntryResponse.get(`rivora_${index}`)!.toString();
      entries.push(Buffer.from(chunkValue, 'base64').toString('utf-8'));
      index++;
    }
    
    if (entries.length > 0) {
      const dataJson = entries.join('');
      return JSON.parse(dataJson) as BlockchainScoreData;
    }
    
    return null;

  } catch (error: any) {
    console.error('❌ Error reading scores from blockchain:', error);
    return null;
  }
}

/**
 * Create transaction XDR for Freighter to sign
 * This allows users to sign with their wallet without exposing secret key
 * Uses Soroban smart contract if configured, otherwise falls back to Data Entry
 */
export async function createSaveScoresTransaction(
  walletAddress: string,
  scores: {
    trustRating: number;
    healthScore: number;
    userType: string;
  }
): Promise<{ xdr: string; network: string; method: 'soroban' | 'data-entry' }> {
  try {
    // Try Soroban first if enabled
    if (USE_SOROBAN) {
      try {
        const result = await createSaveScoresSorobanTransaction(walletAddress, scores);
        return {
          ...result,
          method: 'soroban',
        };
      } catch (sorobanError: any) {
        console.warn('⚠️ Soroban transaction creation failed, falling back to Data Entry:', sorobanError.message);
        // Fall through to Data Entry
      }
    }

    // Fallback to Data Entry (native Stellar)
    const sourceAccount = await horizonServer.loadAccount(walletAddress);

    const scoreData: BlockchainScoreData = {
      walletAddress,
      trustRating: Math.round(scores.trustRating * 100) / 100,
      healthScore: Math.round(scores.healthScore * 100) / 100,
      userType: scores.userType,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    const dataJson = JSON.stringify(scoreData);
    const dataValue = Buffer.from(dataJson).toString('base64');
    const decodedLength = Buffer.from(dataValue, 'base64').length;

    const dataKey = decodedLength <= 64 ? 'rivora_scores' : 'rivora_0';

    const manageDataOp = Operation.manageData({
      name: dataKey,
      value: dataValue,
    });

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'testnet' 
        ? Networks.TESTNET 
        : Networks.PUBLIC,
    })
      .addOperation(manageDataOp)
      .setTimeout(30)
      .build();

    return {
      xdr: transaction.toXDR(),
      network: NETWORK === 'testnet' ? 'testnet' : 'public',
      method: 'data-entry',
    };

  } catch (error: any) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
}

