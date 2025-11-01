// Data Analysis Functions
// This module transforms raw Stellar blockchain data into scoring metrics
// Updated for Stellar network integration

interface WalletData {
  balances: any;
  history: any;
  gasPrice: any;
  fusionOrders: any;
  limitOrders: any;
  accountAge?: number; // Stellar account age in days (optional, can come from account data)
}

// ========================================
// RISK SCORE METRICS ANALYSIS
// ========================================

export function analyzeWalletAge(history: any): number {
  if (!history || !history.result || history.result.length === 0) {
    return 20; // Default score for new/unknown wallets
  }

  // Find the earliest transaction
  const transactions = history.result;
  const earliestTx = transactions[transactions.length - 1];
  
  if (!earliestTx || !earliestTx.timeStamp) {
    return 20;
  }

  // Calculate wallet age in days
  const walletCreationTime = parseInt(earliestTx.timeStamp) * 1000;
  const currentTime = Date.now();
  const ageInDays = (currentTime - walletCreationTime) / (1000 * 60 * 60 * 24);

  // Score based on age (0-100 scale)
  if (ageInDays < 30) return 20;        // Very new wallet
  if (ageInDays < 90) return 40;        // Young wallet
  if (ageInDays < 365) return 60;       // Mature wallet
  if (ageInDays < 1095) return 80;      // Experienced wallet
  return 100;                           // Veteran wallet (3+ years)
}

export function analyzeTransactionFrequency(history: any): number {
  if (!history || !history.result || history.result.length === 0) {
    return 10; // Very low score for no transactions
  }

  const transactions = history.result;
  const txCount = transactions.length;

  // Calculate frequency score (0-100 scale)
  if (txCount < 10) return 20;          // Very low activity
  if (txCount < 50) return 40;          // Low activity
  if (txCount < 200) return 60;         // Moderate activity
  if (txCount < 500) return 80;         // High activity
  return 100;                           // Very high activity
}

export function analyzeSecureSwapUsage(fusionOrders: any, history: any): number {
  let securityScore = 50; // Base score

  // Stellar doesn't have "Fusion+" but we can analyze path payments and DEX usage
  // Path payments indicate smart routing (similar to Fusion+)
  
  // Analyze transaction patterns for secure behavior
  if (history && history.result) {
    const transactions = history.result;
    
    // Count path payment operations (indicates smart routing/swaps)
    const pathPaymentOps = transactions.filter((tx: any) => 
      tx.type === 'path_payment_strict_receive' || 
      tx.type === 'path_payment_strict_send'
    ).length;

    if (transactions.length > 0) {
      const pathPaymentRatio = pathPaymentOps / transactions.length;
      securityScore += pathPaymentRatio * 30; // Up to 30 bonus points for path payments
    }

    // Additional security points for transaction success rate
    const successfulTxs = transactions.filter((tx: any) => 
      tx.transactionSuccessful !== false
    ).length;
    
    if (transactions.length > 0) {
      const successRatio = successfulTxs / transactions.length;
      securityScore += successRatio * 20; // Up to 20 bonus points
    }
  }

  return Math.min(100, securityScore);
}

export function analyzeTokenTrustworthiness(balances: any): number {
  if (!balances || Object.keys(balances).length === 0) {
    return 30; // Default score for empty portfolio
  }

  // Known trusted Stellar assets
  const trustedAssets = [
    'XLM', // Native Stellar
    'USDC', // USD Coin on Stellar
    'USDT', // Tether on Stellar
    'BTC', // Bitcoin on Stellar (various issuers)
    'ETH', // Ethereum on Stellar
  ];

  const assetKeys = Object.keys(balances);
  const trustedCount = assetKeys.filter(key => {
    // Check if asset code is in trusted list
    return trustedAssets.some(asset => key.includes(asset));
  }).length;

  const trustworthinessRatio = trustedCount / Math.max(assetKeys.length, 1);
  
  // Score based on ratio of trusted tokens (30-100 scale)
  return 30 + (trustworthinessRatio * 70);
}

// ========================================
// HEALTH SCORE METRICS ANALYSIS
// ========================================

export function analyzeTokenDiversity(balances: any): number {
  if (!balances || Object.keys(balances).length === 0) {
    return 30; // Default score for empty portfolio
  }

  const tokenCount = Object.keys(balances).length;
  
  // Score based on number of different tokens (30-100 scale)
  if (tokenCount === 1) return 30;      // Single token
  if (tokenCount < 5) return 50;        // Low diversity
  if (tokenCount < 10) return 70;       // Moderate diversity
  if (tokenCount < 20) return 85;       // High diversity
  return 100;                           // Very high diversity
}

export function analyzePortfolioConcentration(balances: any): number {
  if (!balances || Object.keys(balances).length === 0) {
    return 50; // Default score for empty portfolio
  }

  const balanceValues = Object.values(balances) as string[];
  const totalValue = balanceValues.reduce((sum, balance) => 
    sum + parseFloat(balance || '0'), 0
  );

  if (totalValue === 0) return 50; // Default score

  // Calculate Herfindahl-Hirschman Index (concentration)
  const concentrationIndex = balanceValues.reduce((sum, balance) => {
    const proportion = parseFloat(balance || '0') / totalValue;
    return sum + (proportion * proportion);
  }, 0);

  // Convert to score (lower concentration = higher score)
  const concentrationScore = (1 - concentrationIndex) * 100;
  return Math.max(30, Math.min(100, concentrationScore)); // Ensure valid range
}

export function analyzeTokenAgeAverage(balances: any): number {
  // Stellar asset maturity analysis based on well-known stablecoins and major assets
  
  if (!balances || Object.keys(balances).length === 0) {
    return 50; // Default score
  }

  // Known mature Stellar assets (established issuers and stablecoins)
  const matureAssets = [
    'XLM', // Native Stellar - always mature
    'USDC', // Circle's USD Coin
    'USDT', // Tether
  ];

  const assetKeys = Object.keys(balances);
  const matureCount = assetKeys.filter(key => 
    matureAssets.some(asset => key.includes(asset))
  ).length;

  const maturityRatio = matureCount / Math.max(assetKeys.length, 1);
  return 30 + (maturityRatio * 70); // 30-100 scale
}

export function analyzeVolatilityExposure(balances: any): number {
  // Stellar volatility analysis based on asset types
  if (!balances || Object.keys(balances).length === 0) {
    return 50; // Default score
  }

  // Stablecoins and major assets = low volatility = high score
  const stableAssets = [
    'XLM', // Native Stellar (relatively stable)
    'USDC', // USD Coin (stablecoin)
    'USDT', // Tether (stablecoin)
  ];

  const assetKeys = Object.keys(balances);
  const stableCount = assetKeys.filter(key => 
    stableAssets.some(asset => key.includes(asset))
  ).length;

  const stabilityRatio = stableCount / Math.max(assetKeys.length, 1);
  return 20 + (stabilityRatio * 80); // 20-100 scale
}

export function analyzeGasEfficiency(history: any, gasPrice: any): number {
  if (!history || !history.result || history.result.length === 0) {
    return 50; // Default score
  }

  // Simplified gas efficiency analysis
  // In a real implementation, you'd compare gas prices paid vs market rates
  
  const transactions = history.result;
  const avgGasUsed = transactions.reduce((sum: number, tx: any) => 
    sum + parseInt(tx.gasUsed || '0'), 0
  ) / transactions.length;

  // Score based on average gas usage (lower is better)
  if (avgGasUsed < 50000) return 90;    // Very efficient
  if (avgGasUsed < 100000) return 70;   // Efficient
  if (avgGasUsed < 200000) return 50;   // Average
  if (avgGasUsed < 500000) return 30;   // Inefficient
  return 10;                            // Very inefficient
}

// ========================================
// BEHAVIORAL ANALYSIS FOR USER TYPE
// ========================================

export function analyzeBehaviorMetrics(history: any, limitOrders: any) {
  if (!history || !history.result) {
    return {
      swapFrequency: 0,
      limitOrderUsage: 0,
      transactionTiming: 'mixed' as const,
      newTokenInteraction: 50,
      gasOptimization: 50,
    };
  }

  const transactions = history.result;
  const txCount = transactions.length;

  // Calculate swaps per month (approximate)
  const swapFrequency = txCount / 3; // Assuming 3 months of data

  // Limit order usage percentage
  const limitOrderCount = limitOrders?.orders?.length || 0;
  const limitOrderUsage = txCount > 0 ? (limitOrderCount / txCount) * 100 : 0;

  // Transaction timing analysis (simplified)
  const transactionTiming = 'mixed' as const; // Would need timestamp analysis

  // New token interaction (simplified)
  const newTokenInteraction = 30; // Default estimate

  // Gas optimization (simplified)
  const gasOptimization = 40; // Default estimate

  return {
    swapFrequency,
    limitOrderUsage,
    transactionTiming,
    newTokenInteraction,
    gasOptimization,
  };
}
