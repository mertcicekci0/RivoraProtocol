// ML Feature Extraction for Stellar Wallet Analysis
// Extracts simplified features from Stellar portfolio data for ML model training

import { StellarPortfolioData } from './stellar-service';

export interface MLFeatures {
  accountAgeDays: number;
  totalTransactions: number;
  transactionFrequency: number;
  pathPaymentRatio: number;
  assetCount: number;
  portfolioConcentration: number;
  trustedAssetRatio: number;
  successRate: number;
}

/**
 * Extract simplified features for ML model (hackathon version)
 * These features will be used to train neural network models
 */
export function extractMLFeatures(
  portfolioData: StellarPortfolioData
): MLFeatures {
  const transactions = portfolioData.transactions || [];
  const operations = portfolioData.operations || [];
  const balances = portfolioData.balances || [];
  
  // Account age in days
  const accountAgeDays = portfolioData.accountAge || 0;
  
  // Total transaction count
  const totalTransactions = transactions.length;
  
  // Calculate transaction frequency (per month)
  let transactionFrequency = 0;
  if (transactions.length > 0) {
    const oldestTx = transactions[transactions.length - 1];
    const newestTx = transactions[0];
    
    if (oldestTx && newestTx) {
      const timeSpan = (new Date(newestTx.createdAt).getTime() - 
                       new Date(oldestTx.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
      transactionFrequency = totalTransactions / Math.max(timeSpan, 1);
    } else if (accountAgeDays > 0) {
      // Fallback: use account age if transaction dates unavailable
      transactionFrequency = (totalTransactions / accountAgeDays) * 30;
    }
  }
  
  // Path payment ratio (smart swaps / total operations)
  const pathPayments = operations.filter(op => 
    op.type === 'path_payment_strict_receive' || op.type === 'path_payment_strict_send'
  ).length;
  const pathPaymentRatio = operations.length > 0 ? pathPayments / operations.length : 0;
  
  // Asset count (excluding native XLM)
  const assetCount = Math.max(0, balances.length - 1);
  
  // Portfolio concentration using Herfindahl-Hirschman Index (HHI)
  let portfolioConcentration = 1.0; // Default to fully concentrated (single asset)
  if (balances.length > 0) {
    const balanceValues = balances.map(b => parseFloat(b.balance || '0'));
    const totalValue = balanceValues.reduce((sum, val) => sum + val, 0);
    
    if (totalValue > 0) {
      portfolioConcentration = balanceValues.reduce((sum, val) => {
        const proportion = val / totalValue;
        return sum + (proportion * proportion);
      }, 0);
    }
  }
  
  // Trusted assets ratio
  const trustedAssets = ['XLM', 'USDC', 'USDT'];
  const trustedCount = balances.filter(b => 
    trustedAssets.includes(b.assetCode || 'XLM')
  ).length;
  const trustedAssetRatio = balances.length > 0 ? trustedCount / balances.length : 0;
  
  // Success rate (simplified - assume all existing transactions are successful)
  // In reality, failed transactions might not be in the transaction list
  const successRate = totalTransactions > 0 ? 1.0 : 0;
  
  return {
    accountAgeDays: Math.min(accountAgeDays, 3650), // Cap at 10 years for normalization
    totalTransactions: Math.min(totalTransactions, 10000), // Cap at 10k
    transactionFrequency: Math.min(transactionFrequency, 1000), // Cap at 1000/month
    pathPaymentRatio,
    assetCount: Math.min(assetCount, 50), // Cap at 50 assets
    portfolioConcentration,
    trustedAssetRatio,
    successRate,
  };
}

/**
 * Normalize features for neural network input (0-1 range)
 * This ensures all features are on the same scale for better training
 */
export function normalizeFeatures(features: MLFeatures): number[] {
  return [
    features.accountAgeDays / 3650,           // 0-1 (max 10 years)
    features.totalTransactions / 10000,       // 0-1 (max 10k transactions)
    features.transactionFrequency / 1000,     // 0-1 (max 1000/month)
    features.pathPaymentRatio,                // Already 0-1
    features.assetCount / 50,                 // 0-1 (max 50 assets)
    features.portfolioConcentration,          // Already 0-1 (HHI)
    1 - features.portfolioConcentration,      // Inverse (diversification)
    features.trustedAssetRatio,               // Already 0-1
    features.successRate,                     // Already 0-1
  ];
}

