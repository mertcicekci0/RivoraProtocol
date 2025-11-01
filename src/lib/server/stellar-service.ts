// Stellar Horizon API Service
// Fetches account data, transactions, operations, and effects from Stellar network

import { Horizon } from '@stellar/stellar-sdk';

// Stellar network configuration
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org';
const TESTNET_HORIZON_URL = process.env.STELLAR_TESTNET_HORIZON_URL || 'https://horizon-testnet.stellar.org';

// Network type (mainnet or testnet)
const NETWORK = (process.env.STELLAR_NETWORK || 'mainnet') as 'mainnet' | 'testnet';

// Initialize Horizon server
const horizonServer = new Horizon.Server(
  NETWORK === 'testnet' ? TESTNET_HORIZON_URL : HORIZON_URL
);

// Stellar account data interfaces
export interface StellarAccountData {
  accountId: string;
  balances: StellarBalance[];
  sequenceNumber: string;
  subentryCount: number;
  inflationDestination?: string;
  homeDomain?: string;
  signers: Array<{
    key: string;
    type: string;
    weight: number;
  }>;
  createdAt: string;
  lastModifiedLedger: number;
}

export interface StellarBalance {
  assetType: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  assetCode?: string;
  assetIssuer?: string;
  balance: string;
  limit?: string;
  buyingLiabilities?: string;
  sellingLiabilities?: string;
  isAuthorized?: boolean;
  isAuthorizedToMaintainLiabilities?: boolean;
  lastModifiedLedger?: number;
}

export interface StellarTransaction {
  id: string;
  pagingToken: string;
  hash: string;
  ledger: number;
  createdAt: string;
  sourceAccount: string;
  sourceAccountSequence: string;
  feeAccount?: string;
  feeCharged: string;
  operationCount: number;
  envelopeXdr: string;
  resultXdr: string;
  resultMetaXdr: string;
  feeMetaXdr: string;
  memoType?: string;
  memo?: string;
  signatures: string[];
  validAfter?: string;
  validBefore?: string;
}

export interface StellarOperation {
  id: string;
  pagingToken: string;
  transactionHash: string;
  transactionSuccessful: boolean;
  type: string;
  typeI: number;
  sourceAccount: string;
  createdAt: string;
  operationDetails: any;
}

export interface StellarEffect {
  id: string;
  pagingToken: string;
  account: string;
  type: string;
  typeI: number;
  createdAt: string;
  effectDetails: any;
}

// Portfolio data structure for TensorFlow analysis
export interface StellarPortfolioData {
  balances: StellarBalance[];
  transactions: StellarTransaction[];
  operations: StellarOperation[];
  effects: StellarEffect[];
  accountAge: number; // in days
  trustlines: number;
  totalValue: number; // USD (to be calculated)
  nativeBalance: string; // XLM
  assets: Array<{
    code: string;
    issuer?: string;
    balance: string;
    valueUSD: number;
  }>;
}

/**
 * Validate Stellar public key format
 */
export function isValidStellarPublicKey(accountId: string): boolean {
  // Stellar public keys start with G and are 56 characters long (base32 encoded)
  return /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/.test(accountId);
}

/**
 * Get Stellar account details
 */
export async function getStellarAccount(accountId: string): Promise<StellarAccountData | null> {
  try {
    if (!isValidStellarPublicKey(accountId)) {
      throw new Error('Invalid Stellar public key format');
    }

    const account = await horizonServer.loadAccount(accountId);
    
    return {
      accountId: account.accountId(),
      balances: account.balances.map(b => ({
        assetType: b.asset_type,
        assetCode: b.asset_code,
        assetIssuer: b.asset_issuer,
        balance: b.balance,
        limit: b.limit,
        buyingLiabilities: b.buying_liabilities,
        sellingLiabilities: b.selling_liabilities,
        isAuthorized: b.is_authorized,
        isAuthorizedToMaintainLiabilities: b.is_authorized_to_maintain_liabilities,
        lastModifiedLedger: b.last_modified_ledger,
      })),
      sequenceNumber: account.sequenceNumber(),
      subentryCount: account.subentryCount(),
      inflationDestination: account.inflationDestination(),
      homeDomain: account.homeDomain(),
      signers: account.signers,
      createdAt: account.createdAt(),
      lastModifiedLedger: account.lastModifiedLedger(),
    };
  } catch (error: any) {
    console.error('Error fetching Stellar account:', error);
    if (error?.response?.status === 404 || error?.message?.includes('404')) {
      return null; // Account doesn't exist
    }
    throw error;
  }
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(
  accountId: string,
  limit: number = 200,
  order: 'asc' | 'desc' = 'desc'
): Promise<StellarTransaction[]> {
  try {
    if (!isValidStellarPublicKey(accountId)) {
      throw new Error('Invalid Stellar public key format');
    }

    const builder = horizonServer
      .transactions()
      .forAccount(accountId)
      .limit(limit)
      .order(order === 'desc' ? Horizon.Order.desc : Horizon.Order.asc);

    const { records } = await builder.call();
    
    return records.map(tx => ({
      id: tx.id,
      pagingToken: tx.paging_token,
      hash: tx.hash,
      ledger: tx.ledger_attr,
      createdAt: tx.created_at,
      sourceAccount: tx.source_account,
      sourceAccountSequence: tx.source_account_sequence,
      feeAccount: tx.fee_account,
      feeCharged: tx.fee_charged,
      operationCount: tx.operation_count,
      envelopeXdr: tx.envelope_xdr,
      resultXdr: tx.result_xdr,
      resultMetaXdr: tx.result_meta_xdr,
      feeMetaXdr: tx.fee_meta_xdr,
      memoType: tx.memo_type,
      memo: tx.memo,
      signatures: tx.signatures,
      validAfter: tx.valid_after,
      validBefore: tx.valid_before,
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Get account operations
 */
export async function getAccountOperations(
  accountId: string,
  limit: number = 200
): Promise<StellarOperation[]> {
  try {
    if (!isValidStellarPublicKey(accountId)) {
      throw new Error('Invalid Stellar public key format');
    }

    const { records } = await horizonServer
      .operations()
      .forAccount(accountId)
      .limit(limit)
      .order('desc')
      .call();

    return records.map(op => ({
      id: op.id,
      pagingToken: op.paging_token,
      transactionHash: op.transaction_hash,
      transactionSuccessful: op.transaction_successful,
      type: op.type,
      typeI: op.type_i,
      sourceAccount: op.source_account || accountId,
      createdAt: op.created_at,
      operationDetails: op,
    }));
  } catch (error) {
    console.error('Error fetching operations:', error);
    throw error;
  }
}

/**
 * Get account effects (operations effects)
 */
export async function getAccountEffects(
  accountId: string,
  limit: number = 200
): Promise<StellarEffect[]> {
  try {
    if (!isValidStellarPublicKey(accountId)) {
      throw new Error('Invalid Stellar public key format');
    }

    const { records } = await horizonServer
      .effects()
      .forAccount(accountId)
      .limit(limit)
      .order('desc')
      .call();

    return records.map(effect => ({
      id: effect.id,
      pagingToken: effect.paging_token,
      account: effect.account,
      type: effect.type,
      typeI: effect.type_i,
      createdAt: effect.created_at,
      effectDetails: effect,
    }));
  } catch (error) {
    console.error('Error fetching effects:', error);
    throw error;
  }
}

/**
 * Get comprehensive portfolio data for analysis
 */
export async function getStellarPortfolioData(
  accountId: string
): Promise<StellarPortfolioData | null> {
  try {
    if (!isValidStellarPublicKey(accountId)) {
      throw new Error('Invalid Stellar public key format. Must start with G and be 56 characters.');
    }

    // Fetch account - if it doesn't exist, we'll still return empty data structure
    // This allows analysis to continue with low scores instead of error
    let account;
    try {
      account = await getStellarAccount(accountId);
    } catch (error: any) {
      // If account doesn't exist (404), return empty structure for analysis
      if (error?.response?.status === 404 || error?.message?.includes('404')) {
        console.log('Account not found, returning empty data for analysis');
        return null; // Will be handled by caller to use default data
      }
      throw error; // Re-throw other errors
    }
    
    if (!account) {
      return null; // Account doesn't exist - caller will use default data
    }

    // Fetch transactions, operations, and effects in parallel (only if account exists)
    // Catch errors for individual calls to prevent one failing from breaking everything
    const [transactions, operations, effects] = await Promise.allSettled([
      getAccountTransactions(accountId, 200).catch(err => {
        console.warn('Failed to fetch transactions:', err);
        return [];
      }),
      getAccountOperations(accountId, 200).catch(err => {
        console.warn('Failed to fetch operations:', err);
        return [];
      }),
      getAccountEffects(accountId, 200).catch(err => {
        console.warn('Failed to fetch effects:', err);
        return [];
      }),
    ]);

    const transactionsData = transactions.status === 'fulfilled' ? transactions.value : [];
    const operationsData = operations.status === 'fulfilled' ? operations.value : [];
    const effectsData = effects.status === 'fulfilled' ? effects.value : [];

    // Calculate account age
    const createdAt = new Date(account.createdAt);
    const now = new Date();
    const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Extract assets (excluding native XLM)
    const assets = account.balances
      .filter(b => b.assetType !== 'native')
      .map(b => ({
        code: b.assetCode || '',
        issuer: b.assetIssuer,
        balance: b.balance,
        valueUSD: 0, // TODO: Get asset prices from external API
      }));

    // Get native XLM balance
    const nativeBalance = account.balances.find(b => b.assetType === 'native')?.balance || '0';

    // Count trustlines
    const trustlines = account.balances.length - 1; // Exclude native XLM

    // TODO: Calculate total value in USD
    // This requires asset price data from external APIs
    const totalValue = 0;

    return {
      balances: account.balances,
      transactions: transactionsData,
      operations: operationsData,
      effects: effectsData,
      accountAge,
      trustlines,
      totalValue,
      nativeBalance,
      assets,
    };
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    throw error;
  }
}

/**
 * Convert Stellar portfolio data to format compatible with existing analyzers
 */
export function convertStellarToAnalysisFormat(
  portfolioData: StellarPortfolioData
): {
  balances: Record<string, string>;
  history: {
    result: Array<{
      hash: string;
      timeStamp: number;
      from: string;
      gasUsed: string;
      operationCount: number;
      type?: string;
    }>;
  };
  gasPrice: number | null;
  fusionOrders: any;
  limitOrders: any;
} {
  // Transform Stellar data to match existing analyzer function signatures
  const balances: Record<string, string> = {};
  
  // Handle empty balances array
  if (portfolioData.balances && portfolioData.balances.length > 0) {
    portfolioData.balances.forEach(balance => {
      const key = balance.assetType === 'native' 
        ? 'XLM' 
        : `${balance.assetCode}_${balance.assetIssuer}`;
      balances[key] = balance.balance;
    });
  }

  // Handle empty transactions array
  const transactions = portfolioData.transactions || [];
  
  return {
    balances,
    history: {
      result: transactions.map(tx => ({
        hash: tx.hash,
        timeStamp: Math.floor(new Date(tx.createdAt).getTime() / 1000),
        from: tx.sourceAccount,
        gasUsed: tx.feeCharged, // Stellar fees (stroops converted to XLM)
        operationCount: tx.operationCount,
        type: 'payment', // Can be enhanced with actual operation types
      })),
    },
    gasPrice: null, // Stellar doesn't use dynamic gas prices
    fusionOrders: null, // Can be mapped from path payment operations
    limitOrders: null, // Can be mapped from manage offer operations
  };
}

