// Soroban Smart Contract Service
// Interacts with the Rivora Scores Soroban contract on Stellar

import { 
  TransactionBuilder, 
  Operation,
  Networks,
  BASE_FEE,
  xdr,
  Keypair,
} from '@stellar/stellar-sdk';
import { Horizon, SorobanRpc } from '@stellar/stellar-sdk';

// Stellar network configuration
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org';
const TESTNET_HORIZON_URL = process.env.STELLAR_TESTNET_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'mainnet' | 'testnet';
const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || '';

// Soroban RPC endpoints
const SOROBAN_RPC_URL = NETWORK === 'testnet' 
  ? process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
  : process.env.SOROBAN_RPC_URL || 'https://soroban.stellar.org';

const horizonServer = new Horizon.Server(
  NETWORK === 'testnet' ? TESTNET_HORIZON_URL : HORIZON_URL
);

const sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

export interface ScoreData {
  walletAddress: string;
  trustRating: number;  // 0-100
  healthScore: number;  // 0-100
  userType: string;     // "conservative", "balanced", "aggressive"
  timestamp: number;    // Unix timestamp
  version: string;
}

export interface SorobanSaveResult {
  success: boolean;
  transactionHash?: string;
  ledger?: number;
  error?: string;
}

/**
 * Convert a Stellar public key (G...) to an Address for Soroban
 */
function publicKeyToAddress(publicKey: string): string {
  // For Soroban, we need to convert the public key to a contract address
  // This is a simplified conversion - in production, you'd use proper SDK methods
  return publicKey;
}

/**
 * Convert user type string to Symbol
 */
function userTypeToSymbol(userType: string): string {
  const validTypes = ['conservative', 'balanced', 'aggressive'];
  if (!validTypes.includes(userType.toLowerCase())) {
    throw new Error(`Invalid user type: ${userType}. Must be one of: ${validTypes.join(', ')}`);
  }
  return userType.toLowerCase();
}

/**
 * Create a transaction to invoke the save_scores function on the Soroban contract
 * 
 * @param walletAddress Stellar public key
 * @param scores Score data to save
 * @returns Transaction XDR and network info
 */
export async function createSaveScoresSorobanTransaction(
  walletAddress: string,
  scores: {
    trustRating: number;
    healthScore: number;
    userType: string;
  }
): Promise<{ xdr: string; network: string }> {
  try {
    if (!CONTRACT_ID) {
      throw new Error('SOROBAN_CONTRACT_ID environment variable is not set');
    }

    // Load account
    const sourceAccount = await horizonServer.loadAccount(walletAddress);

    // Convert scores to contract format (multiply by 100 for integer storage)
    const trustRatingInt = Math.round(scores.trustRating * 100);
    const healthScoreInt = Math.round(scores.healthScore * 100);

    // Build the InvokeHostFunction operation for Soroban
    const contractAddress = xdr.ScAddress.scAddressTypeContract(
      xdr.Hash.fromHex(CONTRACT_ID)
    );

    // Convert wallet address to Address type for contract
    // Simple approach - use the address string directly converted to ScAddress
    const walletScAddress = xdr.ScAddress.scAddressTypeAccount(
      xdr.PublicKey.publicKeyTypeEd25519(
        xdr.Uint256.fromB58(walletAddress.substring(1)) // Remove 'G' prefix
      )
    );

    const functionName = xdr.ScSymbol.fromString('save_scores');
    const args = [
      xdr.ScVal.scvAddress(walletScAddress),
      xdr.ScVal.scvI128(
        new xdr.Int128Parts({
          lo: BigInt(trustRatingInt),
          hi: BigInt(0),
        })
      ),
      xdr.ScVal.scvI128(
        new xdr.Int128Parts({
          lo: BigInt(healthScoreInt),
          hi: BigInt(0),
        })
      ),
      xdr.ScVal.scvSymbol(xdr.ScSymbol.fromString(userTypeToSymbol(scores.userType))),
    ];

    const invokeHostFunctionOp = Operation.invokeHostFunction({
      function: xdr.HostFunction.hostFunctionTypeInvokeContract(
        new xdr.InvokeContractArgs({
          contractAddress: contractAddress,
          functionName: functionName,
          args: args,
        })
      ),
    });

    // Build transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'testnet' 
        ? Networks.TESTNET 
        : Networks.PUBLIC,
    })
      .addOperation(invokeHostFunctionOp)
      .setTimeout(30)
      .build();

    // Simulate transaction (Soroban requires simulation)
    await sorobanServer.simulateTransaction(transaction);

    return {
      xdr: transaction.toXDR(),
      network: NETWORK === 'testnet' ? 'testnet' : 'public',
    };

  } catch (error: any) {
    console.error('❌ Error creating Soroban transaction:', error);
    throw new Error(`Failed to create Soroban transaction: ${error.message}`);
  }
}

/**
 * Read scores from Soroban contract
 * 
 * @param walletAddress Stellar public key
 * @returns Score data if exists, null otherwise
 */
export async function readScoresFromSoroban(
  walletAddress: string
): Promise<ScoreData | null> {
  try {
    if (!CONTRACT_ID) {
      throw new Error('SOROBAN_CONTRACT_ID environment variable is not set');
    }

    // Call the contract's get_scores function
    // This is a simplified version - full implementation would use proper Soroban SDK
    const result = await sorobanServer.callContract({
      contractAddress: CONTRACT_ID,
      function: 'get_scores',
      args: [walletAddress],
    });

    if (!result || !result.result) {
      return null;
    }

    // Parse result (this is simplified - actual parsing depends on contract response format)
    const data = result.result;
    
    return {
      walletAddress,
      trustRating: (data.trust_rating || 0) / 100, // Convert back from integer
      healthScore: (data.health_score || 0) / 100,
      userType: data.user_type || 'balanced',
      timestamp: data.timestamp || 0,
      version: data.version || '1.0.0',
    };

  } catch (error: any) {
    console.error('❌ Error reading scores from Soroban:', error);
    return null;
  }
}

/**
 * Check if scores exist for a wallet
 * 
 * @param walletAddress Stellar public key
 * @returns True if scores exist, false otherwise
 */
export async function hasScoresOnSoroban(
  walletAddress: string
): Promise<boolean> {
  try {
    const scores = await readScoresFromSoroban(walletAddress);
    return scores !== null;
  } catch (error) {
    return false;
  }
}

