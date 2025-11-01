// Data Analysis Functions
// This module transforms raw blockchain data into scoring metrics
// ❌ UPDATED: Removed 1inch-specific references

interface WalletData {
  balances: any;
  history: any;
  gasPrice: any;
  fusionOrders: any;
  limitOrders: any;
}
// TODO: Update for Stellar data format

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

  // Bonus for using Fusion+ (secure swaps)
  if (fusionOrders && fusionOrders.orders && fusionOrders.orders.length > 0) {
    securityScore += 30;
  }

  // Analyze transaction patterns for security-conscious behavior
  if (history && history.result) {
    const transactions = history.result;
    
    // Check for interactions with known secure protocols
    const secureProtocols = ['1inch', 'uniswap', 'curve', 'balancer'];
    const secureInteractions = transactions.filter((tx: any) => 
      secureProtocols.some(protocol => 
        tx.to?.toLowerCase().includes(protocol) || 
        tx.input?.toLowerCase().includes(protocol)
      )
    ).length;

    const securityRatio = secureInteractions / transactions.length;
    securityScore += securityRatio * 20; // Up to 20 bonus points
  }

  return Math.min(100, securityScore);
}

export function analyzeTokenTrustworthiness(balances: any): number {
  if (!balances || Object.keys(balances).length === 0) {
    return 30; // Default score for empty portfolio
  }

  // Known trusted tokens (you can expand this list)
  const trustedTokens = [
    '0xa0b86a33e6b8e6b9c4b25e1e1e7d2e3f4e5e6e7e', // ETH
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0xa0b86a33e6b8e6b9c4b25e1e1e7d2e3f4e5e6e7e', // USDC
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    // Add more trusted token addresses
  ];

  const tokenAddresses = Object.keys(balances);
  const trustedCount = tokenAddresses.filter(addr => 
    trustedTokens.includes(addr.toLowerCase())
  ).length;

  const trustworthinessRatio = trustedCount / tokenAddresses.length;
  
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
  // This would require additional API calls to get token creation dates
  // For hackathon purposes, we'll use a simplified heuristic
  
  if (!balances || Object.keys(balances).length === 0) {
    return 50; // Default score
  }

  // Known mature tokens get higher scores
  const matureTokens = [
    '0xa0b86a33e6b8e6b9c4b25e1e1e7d2e3f4e5e6e7e', // ETH
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  ];

  const tokenAddresses = Object.keys(balances);
  const matureCount = tokenAddresses.filter(addr => 
    matureTokens.includes(addr.toLowerCase())
  ).length;

  const maturityRatio = matureCount / tokenAddresses.length;
  return 30 + (maturityRatio * 70); // 30-100 scale
}

export function analyzeVolatilityExposure(balances: any): number {
  // Simplified volatility analysis based on token types
  if (!balances || Object.keys(balances).length === 0) {
    return 50; // Default score
  }

  // Stable coins and major tokens = low volatility = high score
  const stableTokens = [
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0xa0b86a33e6b8e6b9c4b25e1e1e7d2e3f4e5e6e7e', // USDC
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  ];

  const tokenAddresses = Object.keys(balances);
  const stableCount = tokenAddresses.filter(addr => 
    stableTokens.includes(addr.toLowerCase())
  ).length;

  const stabilityRatio = stableCount / tokenAddresses.length;
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
