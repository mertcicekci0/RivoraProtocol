// API Route: /api/calculate-scores
// Main endpoint for calculating DeFi scores

import type { NextApiRequest, NextApiResponse } from 'next';
// ❌ REMOVED: import { getPortfolioData } from '../../lib/server/oneinch-service';
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
  walletAddress: string;
  chainId: number;
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
    const { walletAddress, chainId }: ScoreRequest = req.body;

    if (!walletAddress || !chainId) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress and chainId' 
      });
    }

    // Validate wallet address format (basic validation)
    // TODO: Update for Stellar public key format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format' 
      });
    }

    // Validate chain ID
    // TODO: Update for Stellar network
    const supportedChains = [1, 137, 10, 42161, 8453]; // Ethereum, Polygon, Optimism, Arbitrum, Base
    if (!supportedChains.includes(chainId)) {
      return res.status(400).json({ 
        error: 'Unsupported chain ID' 
      });
    }

    console.log(`🔍 Analyzing wallet: ${walletAddress} on chain: ${chainId}`);
    console.log('⚠️ 1inch API removed - using placeholder data');
    
    // ❌ REMOVED: 1inch API call
    // Placeholder portfolio data structure
    const portfolioData = {
      balances: null,
      history: null,
      gasPrice: null,
      fusionOrders: null,
      limitOrders: null,
    };

    // Step 2: Analyze data quality
    const dataQuality = assessDataQuality(portfolioData);
    const analyzedMetrics: string[] = [];

    // Step 3: Calculate Risk Score Metrics
    console.log('📊 Calculating Risk Score metrics...');
    
    const walletAgeScore = analyzeWalletAge(portfolioData.history);
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

    // Step 5: Calculate Final Scores using TensorFlow.js
    console.log('🧮 Computing final scores with TensorFlow.js...');

    const deFiRiskScore = calculateDeFiRiskScore({
      walletAgeScore,
      transactionFrequencyScore,
      secureSwapUsageScore,
      tokenTrustworthinessScore,
    });

    const deFiHealthScore = calculateDeFiHealthScore({
      tokenDiversityScore,
      portfolioConcentrationScore,
      tokenAgeAverageScore,
      volatilityExposureScore,
      gasEfficiencyScore,
    });

    // Step 6: Classify User Type
    console.log('👤 Classifying user type...');

    const behaviorMetrics = analyzeBehaviorMetrics(
      portfolioData.history,
      portfolioData.limitOrders
    );

    const userType = classifyUserType(behaviorMetrics);
    analyzedMetrics.push('User Behavior Classification');

    // Step 7: Process portfolio data for visualization
    const processedPortfolioData = await processPortfolioData(portfolioData.balances);

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
      wallet: walletAddress.slice(0, 10) + '...',
      riskScore: response.deFiRiskScore,
      healthScore: response.deFiHealthScore,
      userType: response.userType,
      dataQuality,
    });

    // Return successful response
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Score calculation failed:', error);

    // Return error response
    return res.status(500).json({
      error: 'Internal server error during score calculation'
    });
  }
}

// Helper function to process portfolio data for frontend visualization
async function processPortfolioData(balances: any) {
  if (!balances || Object.keys(balances).length === 0) {
    return {
      totalValue: 0,
      tokens: []
    };
  }

  // Placeholder implementation - will be replaced with Stellar data
  return {
    totalValue: 0,
    tokens: []
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
