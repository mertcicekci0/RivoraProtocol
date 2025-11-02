// API Route: /api/calculate-scores
// Main endpoint for calculating DeFi scores

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getStellarPortfolioData,
  convertStellarToAnalysisFormat,
  isValidStellarPublicKey,
} from '../../lib/server/stellar-service';
import { 
  analyzeWalletAge,
  analyzeTransactionFrequency,
  analyzeSecureSwapUsage,
  analyzeTokenTrustworthiness,
  analyzeTokenDiversity,
  analyzePortfolioConcentration,
  analyzeTokenAgeAverage,
  analyzeVolatilityExposure,
  analyzeGasEfficiency,
  analyzeBehaviorMetrics,
} from '../../lib/server/data-analyzer';
import { 
  calculateDeFiRiskScore,
  calculateDeFiHealthScore,
  calculateDeFiRiskScoreWithML,
  calculateDeFiHealthScoreWithML,
  classifyUserType,
} from '../../lib/server/scoring-engine';

// API Response interface
interface ScoreResponse {
  deFiRiskScore: number;
  deFiHealthScore: number;
  userType: string;
  userTypeScore?: number;
  metadata?: {
    dataQuality: 'high' | 'medium' | 'low';
    analyzedMetrics: string[];
    timestamp: string;
  };
  // Include analysis data for frontend
  analysis?: {
    transactionFrequency?: number;
    secureSwapUsage?: number;
    portfolioDiversity?: number;
    portfolioConcentration?: number;
    portfolioVolatility?: number;
    gasEfficiency?: number;
  };
  // Include portfolio data for visualization
  portfolioData?: {
    totalValue?: number;
    tokens?: Array<{
      symbol: string;
      amount: string;
      price: string;
      value: number;
      percentage: number;
    }>;
  };
}

// API Request interface
interface ScoreRequest {
  walletAddress: string; // Stellar public key (G...)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScoreResponse | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { walletAddress }: ScoreRequest = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required field: walletAddress (Stellar public key)' 
      });
    }

    // Validate Stellar public key format
    if (!isValidStellarPublicKey(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid Stellar public key format. Must start with G and be 56 characters long.' 
      });
    }

    console.log(`🔍 Analyzing Stellar account: ${walletAddress}`);
    
    // Fetch Stellar portfolio data
    const stellarPortfolioData = await getStellarPortfolioData(walletAddress);
    
    // If account not found or no activity, create default/empty data structure
    // This allows analysis to continue with low scores instead of error
    const defaultPortfolioData = {
      balances: [],
      transactions: [],
      operations: [],
      effects: [],
      accountAge: 0, // New account
      trustlines: 0,
      totalValue: 0,
      nativeBalance: '0',
      assets: [],
    };

    const portfolioDataForAnalysis = stellarPortfolioData || defaultPortfolioData;
    const hasActivity = stellarPortfolioData !== null && stellarPortfolioData.transactions.length > 0;

    if (!hasActivity) {
      console.log('⚠️ Account has no activity - using default values for analysis (low scores expected)');
    }

    // Convert Stellar data to analysis format
    const portfolioData = convertStellarToAnalysisFormat(portfolioDataForAnalysis);

    // Step 2: Analyze data quality
    const dataQuality = assessDataQuality(portfolioData);
    const analyzedMetrics: string[] = [];

    // Step 3: Calculate Risk Score Metrics
    console.log('📊 Calculating Risk Score metrics...');
    
    // Use account age from Stellar data if available, otherwise calculate from history
    let walletAgeScore: number;
    if (portfolioDataForAnalysis.accountAge !== undefined && portfolioDataForAnalysis.accountAge > 0) {
      // Direct account age calculation for Stellar
      const ageInDays = portfolioDataForAnalysis.accountAge;
      if (ageInDays < 30) walletAgeScore = 20;
      else if (ageInDays < 90) walletAgeScore = 40;
      else if (ageInDays < 365) walletAgeScore = 60;
      else if (ageInDays < 1095) walletAgeScore = 80;
      else walletAgeScore = 100;
    } else {
      // No account age or new account - use history or default to low score
      walletAgeScore = analyzeWalletAge(portfolioData.history);
    }
    analyzedMetrics.push('Wallet Age');

    const transactionFrequencyScore = analyzeTransactionFrequency(portfolioData.history);
    analyzedMetrics.push('Transaction Frequency');

    const secureSwapUsageScore = analyzeSecureSwapUsage(
      portfolioData.fusionOrders, 
      portfolioData.history
    );
    analyzedMetrics.push('Secure Swap Usage');

    const tokenTrustworthinessScore = analyzeTokenTrustworthiness(portfolioData.balances);
    analyzedMetrics.push('Token Trustworthiness');

    // Step 4: Calculate Health Score Metrics
    console.log('🏥 Calculating Health Score metrics...');

    const tokenDiversityScore = analyzeTokenDiversity(portfolioData.balances);
    analyzedMetrics.push('Token Diversity');

    const portfolioConcentrationScore = analyzePortfolioConcentration(portfolioData.balances);
    analyzedMetrics.push('Portfolio Concentration');

    const tokenAgeAverageScore = analyzeTokenAgeAverage(portfolioData.balances);
    analyzedMetrics.push('Token Age Average');

    const volatilityExposureScore = analyzeVolatilityExposure(portfolioData.balances);
    analyzedMetrics.push('Volatility Exposure');

    const gasEfficiencyScore = analyzeGasEfficiency(
      portfolioData.history, 
      portfolioData.gasPrice
    );
    analyzedMetrics.push('Gas Efficiency');

    // Step 5: Calculate Final Scores using ML (if available) or rule-based
    console.log('🧮 Computing final scores...');

    // Try ML prediction first, fallback to rule-based
    const riskScoreResult = calculateDeFiRiskScoreWithML({
      walletAgeScore,
      transactionFrequencyScore,
      secureSwapUsageScore,
      tokenTrustworthinessScore,
    }, stellarPortfolioData || undefined);

    const healthScoreResult = calculateDeFiHealthScoreWithML({
      tokenDiversityScore,
      portfolioConcentrationScore,
      tokenAgeAverageScore,
      volatilityExposureScore,
      gasEfficiencyScore,
    }, stellarPortfolioData || undefined);

    const deFiRiskScore = riskScoreResult.score;
    const deFiHealthScore = healthScoreResult.score;
    const scoringMethod = riskScoreResult.method; // 'ml' or 'rule-based'

    if (scoringMethod === 'ml') {
      console.log('✅ Using ML models for scoring');
    } else {
      console.log('📊 Using rule-based scoring (ML models not loaded)');
    }

    // Step 6: Classify User Type
    console.log('👤 Classifying user type...');

    const behaviorMetrics = analyzeBehaviorMetrics(
      portfolioData.history,
      portfolioData.limitOrders
    );

    const userType = classifyUserType(behaviorMetrics);
    analyzedMetrics.push('User Behavior Classification');

    // Step 7: Process portfolio data for visualization
    const processedPortfolioData = await processPortfolioData(portfolioDataForAnalysis);

    // Step 8: Prepare response with analysis data
    const response: ScoreResponse = {
      deFiRiskScore: Math.round(deFiRiskScore * 100) / 100, // Round to 2 decimal places
      deFiHealthScore: Math.round(deFiHealthScore * 100) / 100,
      userType,
      userTypeScore: Math.round((deFiRiskScore + deFiHealthScore) / 2), // Simple user type score
      metadata: {
        dataQuality,
        analyzedMetrics,
        timestamp: new Date().toISOString(),
      },
      // Include detailed analysis for frontend components
      analysis: {
        transactionFrequency: transactionFrequencyScore,
        secureSwapUsage: secureSwapUsageScore,
        portfolioDiversity: tokenDiversityScore / 100, // Convert to 0-1 scale
        portfolioConcentration: portfolioConcentrationScore / 100,
        portfolioVolatility: volatilityExposureScore / 100,
        gasEfficiency: gasEfficiencyScore / 100,
      },
      // Include portfolio data for visualization
      portfolioData: processedPortfolioData,
    };

    console.log('✅ Score calculation completed:', {
      account: walletAddress.slice(0, 10) + '...',
      riskScore: response.deFiRiskScore,
      healthScore: response.deFiHealthScore,
      userType: response.userType,
      dataQuality,
      accountAge: portfolioDataForAnalysis.accountAge,
      transactions: portfolioDataForAnalysis.transactions.length,
      hasActivity,
    });

    // Return successful response
    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Score calculation failed:', error);

    // Provide more specific error messages
    let errorMessage = 'Internal server error during score calculation';
    
    if (error?.message?.includes('Invalid Stellar public key')) {
      errorMessage = 'Invalid Stellar public key format';
      return res.status(400).json({ error: errorMessage });
    }
    
    if (error?.response?.status === 404 || error?.message?.includes('404')) {
      errorMessage = 'Stellar account not found. Make sure the account exists and has been funded.';
      return res.status(404).json({ error: errorMessage });
    }

    if (error?.message) {
      errorMessage = error.message;
    }

    // Return error response
    return res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}

// Helper function to process portfolio data for frontend visualization
async function processPortfolioData(portfolioData: any) {
  if (!portfolioData || !portfolioData.balances || portfolioData.balances.length === 0) {
    return {
      totalValue: 0,
      tokens: []
    };
  }

  // Process Stellar balances into token format
  const tokens = portfolioData.balances.map((balance: any) => {
    const balanceNum = parseFloat(balance.balance || '0');
    // TODO: Get actual asset prices from external API
    const price = 0; // Placeholder
    const value = balanceNum * price;

    return {
      symbol: balance.assetType === 'native' ? 'XLM' : (balance.assetCode || 'UNKNOWN'),
      amount: balance.balance,
      price: price.toString(),
      value: value,
      percentage: 0, // Will be calculated based on total
    };
  });

  const totalValue = tokens.reduce((sum: number, token: any) => sum + token.value, 0);
  
  // Calculate percentages
  tokens.forEach((token: any) => {
    token.percentage = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
  });

  return {
    totalValue,
    tokens
  };
}

// Helper function to assess data quality
function assessDataQuality(portfolioData: any): 'high' | 'medium' | 'low' {
  let qualityScore = 0;
  const maxScore = 5;

  // Check availability of different data sources
  if (portfolioData.balances) qualityScore++;
  if (portfolioData.history) qualityScore++;
  if (portfolioData.gasPrice) qualityScore++;
  if (portfolioData.fusionOrders) qualityScore++;
  if (portfolioData.limitOrders) qualityScore++;

  const qualityRatio = qualityScore / maxScore;

  if (qualityRatio >= 0.8) return 'high';
  if (qualityRatio >= 0.4) return 'medium';
  return 'low';
}
