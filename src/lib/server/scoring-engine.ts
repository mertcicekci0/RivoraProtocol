// Scoring System with TensorFlow.js
// This module calculates DeFi Risk Score and DeFi Health Score using TensorFlow.js
// Supports both rule-based and ML-based scoring

import * as tf from '@tensorflow/tfjs';
import { extractMLFeatures } from './ml-feature-extractor';
import { predictScoresML, areModelsLoaded } from './ml-scoring-model';
import type { StellarPortfolioData } from './stellar-service';

// Initialize TensorFlow.js with optimizations
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Suppress dev mode warnings in production
  tf.env().set('IS_BROWSER', false);
  tf.env().set('WEBGL_VERSION', 2);
  tf.env().set('WEBGL_CPU_FORWARD', false);
}

// ========================================
// SCORING WEIGHTS CONFIGURATION
// ========================================
const RISK_SCORE_WEIGHTS = {
  walletAge: 0.25,        // 25% - Older wallets are more trustworthy
  transactionFrequency: 0.20, // 20% - Regular activity shows experience
  secureSwapUsage: 0.20,  // 20% - Using Fusion+ and secure protocols
  tokenTrustworthiness: 0.35, // 35% - Interacting with trusted tokens
} as const;

const HEALTH_SCORE_WEIGHTS = {
  tokenDiversity: 0.30,   // 30% - Diversified portfolio is healthier
  portfolioConcentration: 0.25, // 25% - Less concentration is better
  tokenAgeAverage: 0.15,  // 15% - Mature tokens are more stable
  volatilityExposure: 0.20, // 20% - Lower volatility is healthier
  gasEfficiency: 0.10,    // 10% - Efficient gas usage
} as const;

// ========================================
// DEFI RISK SCORE CALCULATION
// ========================================
export function calculateDeFiRiskScore(metrics: {
  walletAgeScore: number;
  transactionFrequencyScore: number;
  secureSwapUsageScore: number;
  tokenTrustworthinessScore: number;
}): number {
  // Convert metrics to TensorFlow tensors
  const walletAgeTensor = tf.scalar(metrics.walletAgeScore);
  const transactionFreqTensor = tf.scalar(metrics.transactionFrequencyScore);
  const secureSwapTensor = tf.scalar(metrics.secureSwapUsageScore);
  const tokenTrustTensor = tf.scalar(metrics.tokenTrustworthinessScore);

  // Create weight tensors
  const walletAgeWeight = tf.scalar(RISK_SCORE_WEIGHTS.walletAge);
  const transactionFreqWeight = tf.scalar(RISK_SCORE_WEIGHTS.transactionFrequency);
  const secureSwapWeight = tf.scalar(RISK_SCORE_WEIGHTS.secureSwapUsage);
  const tokenTrustWeight = tf.scalar(RISK_SCORE_WEIGHTS.tokenTrustworthiness);

  // Calculate weighted components
  const weightedWalletAge = tf.mul(walletAgeTensor, walletAgeWeight);
  const weightedTransactionFreq = tf.mul(transactionFreqTensor, transactionFreqWeight);
  const weightedSecureSwap = tf.mul(secureSwapTensor, secureSwapWeight);
  const weightedTokenTrust = tf.mul(tokenTrustTensor, tokenTrustWeight);

  // Sum all weighted components
  const finalScore = tf.addN([
    weightedWalletAge,
    weightedTransactionFreq,
    weightedSecureSwap,
    weightedTokenTrust
  ]);

  // Extract the numerical value
  const score = finalScore.dataSync()[0];

  // Clean up tensors to prevent memory leaks
  walletAgeTensor.dispose();
  transactionFreqTensor.dispose();
  secureSwapTensor.dispose();
  tokenTrustTensor.dispose();
  walletAgeWeight.dispose();
  transactionFreqWeight.dispose();
  secureSwapWeight.dispose();
  tokenTrustWeight.dispose();
  weightedWalletAge.dispose();
  weightedTransactionFreq.dispose();
  weightedSecureSwap.dispose();
  weightedTokenTrust.dispose();
  finalScore.dispose();

  // Return score clamped between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Risk Score with ML fallback
 * Tries ML prediction first, falls back to rule-based if models not loaded
 */
export function calculateDeFiRiskScoreWithML(
  metrics: {
    walletAgeScore: number;
    transactionFrequencyScore: number;
    secureSwapUsageScore: number;
    tokenTrustworthinessScore: number;
  },
  portfolioData?: StellarPortfolioData
): {
  score: number;
  method: 'ml' | 'rule-based';
} {
  // Try ML prediction if models are loaded and portfolio data available
  if (portfolioData && areModelsLoaded()) {
    try {
      const features = extractMLFeatures(portfolioData);
      const mlPrediction = predictScoresML(features);
      
      if (mlPrediction.riskScore !== null) {
        return {
          score: mlPrediction.riskScore,
          method: 'ml',
        };
      }
    } catch (error) {
      console.warn('⚠️ ML prediction failed, falling back to rule-based:', error);
    }
  }

  // Fallback to rule-based calculation
  return {
    score: calculateDeFiRiskScore(metrics),
    method: 'rule-based',
  };
}

/**
 * Calculate Health Score with ML fallback
 */
export function calculateDeFiHealthScoreWithML(
  metrics: {
    tokenDiversityScore: number;
    portfolioConcentrationScore: number;
    tokenAgeAverageScore: number;
    volatilityExposureScore: number;
    gasEfficiencyScore: number;
  },
  portfolioData?: StellarPortfolioData
): {
  score: number;
  method: 'ml' | 'rule-based';
} {
  // Try ML prediction if models are loaded and portfolio data available
  if (portfolioData && areModelsLoaded()) {
    try {
      const features = extractMLFeatures(portfolioData);
      const mlPrediction = predictScoresML(features);
      
      if (mlPrediction.healthScore !== null) {
        return {
          score: mlPrediction.healthScore,
          method: 'ml',
        };
      }
    } catch (error) {
      console.warn('⚠️ ML prediction failed, falling back to rule-based:', error);
    }
  }

  // Fallback to rule-based calculation
  return {
    score: calculateDeFiHealthScore(metrics),
    method: 'rule-based',
  };
}

// ========================================
// DEFI HEALTH SCORE CALCULATION
// ========================================
export function calculateDeFiHealthScore(metrics: {
  tokenDiversityScore: number;
  portfolioConcentrationScore: number;
  tokenAgeAverageScore: number;
  volatilityExposureScore: number;
  gasEfficiencyScore: number;
}): number {
  // Validate input metrics and replace NaN/undefined values with defaults
  const validatedMetrics = {
    tokenDiversityScore: isNaN(metrics.tokenDiversityScore) ? 50 : metrics.tokenDiversityScore,
    portfolioConcentrationScore: isNaN(metrics.portfolioConcentrationScore) ? 50 : metrics.portfolioConcentrationScore,
    tokenAgeAverageScore: isNaN(metrics.tokenAgeAverageScore) ? 50 : metrics.tokenAgeAverageScore,
    volatilityExposureScore: isNaN(metrics.volatilityExposureScore) ? 50 : metrics.volatilityExposureScore,
    gasEfficiencyScore: isNaN(metrics.gasEfficiencyScore) ? 50 : metrics.gasEfficiencyScore,
  };

  // Convert metrics to TensorFlow tensors
  const tokenDiversityTensor = tf.scalar(validatedMetrics.tokenDiversityScore);
  const concentrationTensor = tf.scalar(validatedMetrics.portfolioConcentrationScore);
  const tokenAgeTensor = tf.scalar(validatedMetrics.tokenAgeAverageScore);
  const volatilityTensor = tf.scalar(validatedMetrics.volatilityExposureScore);
  const gasEfficiencyTensor = tf.scalar(validatedMetrics.gasEfficiencyScore);

  // Create weight tensors
  const diversityWeight = tf.scalar(HEALTH_SCORE_WEIGHTS.tokenDiversity);
  const concentrationWeight = tf.scalar(HEALTH_SCORE_WEIGHTS.portfolioConcentration);
  const tokenAgeWeight = tf.scalar(HEALTH_SCORE_WEIGHTS.tokenAgeAverage);
  const volatilityWeight = tf.scalar(HEALTH_SCORE_WEIGHTS.volatilityExposure);
  const gasWeight = tf.scalar(HEALTH_SCORE_WEIGHTS.gasEfficiency);

  // Calculate weighted components
  const weightedDiversity = tf.mul(tokenDiversityTensor, diversityWeight);
  const weightedConcentration = tf.mul(concentrationTensor, concentrationWeight);
  const weightedTokenAge = tf.mul(tokenAgeTensor, tokenAgeWeight);
  const weightedVolatility = tf.mul(volatilityTensor, volatilityWeight);
  const weightedGasEfficiency = tf.mul(gasEfficiencyTensor, gasWeight);

  // Sum all weighted components
  const finalScore = tf.addN([
    weightedDiversity,
    weightedConcentration,
    weightedTokenAge,
    weightedVolatility,
    weightedGasEfficiency
  ]);

  // Extract the numerical value
  const score = finalScore.dataSync()[0];

  // Clean up tensors to prevent memory leaks
  tokenDiversityTensor.dispose();
  concentrationTensor.dispose();
  tokenAgeTensor.dispose();
  volatilityTensor.dispose();
  gasEfficiencyTensor.dispose();
  diversityWeight.dispose();
  concentrationWeight.dispose();
  tokenAgeWeight.dispose();
  volatilityWeight.dispose();
  gasWeight.dispose();
  weightedDiversity.dispose();
  weightedConcentration.dispose();
  weightedTokenAge.dispose();
  weightedVolatility.dispose();
  weightedGasEfficiency.dispose();
  finalScore.dispose();

  // Return score clamped between 0-100 and validate for NaN
  const finalHealthScore = Math.max(0, Math.min(100, score));
  return isNaN(finalHealthScore) ? 50 : finalHealthScore; // Fallback to 50 if still NaN
}

// ========================================
// USER TYPE CLASSIFICATION
// ========================================
export type UserType = 'Trader' | 'Explorer' | 'Optimizer' | 'Passive';

export function classifyUserType(behaviorMetrics: {
  swapFrequency: number;        // Swaps per month
  limitOrderUsage: number;      // Percentage of orders that are limit orders
  transactionTiming: 'peak' | 'off-peak' | 'mixed'; // When user transacts
  newTokenInteraction: number;  // Percentage of interactions with new/unknown tokens
  gasOptimization: number;      // How often user waits for lower gas prices
}): UserType {
  const { swapFrequency, limitOrderUsage, transactionTiming, newTokenInteraction, gasOptimization } = behaviorMetrics;

  // Trader: High frequency swaps, focuses on price optimization
  if (swapFrequency > 20 && transactionTiming === 'peak') {
    return 'Trader';
  }

  // Explorer: High interaction with new tokens, experimental behavior
  if (newTokenInteraction > 40) {
    return 'Explorer';
  }

  // Optimizer: Uses limit orders, waits for low gas, off-peak transactions
  if (limitOrderUsage > 30 || gasOptimization > 60 || transactionTiming === 'off-peak') {
    return 'Optimizer';
  }

  // Passive: Low activity, holds assets without frequent transactions
  if (swapFrequency < 5) {
    return 'Passive';
  }

  // Default fallback
  return 'Trader';
}

// ========================================
// LIMIT ORDER INTELLIGENCE FUNCTIONS
// ========================================

// Calculate optimal limit price based on user's risk score and market conditions
export function calculateOptimalLimitPrice(
  currentPrice: number,
  userRiskScore: number,
  userType: string,
  orderType: 'buy' | 'sell'
): {
  suggestedPrice: number;
  pricePercentage: number;
  confidence: number;
  reasoning: string;
} {
  // Base spread percentage based on risk score
  let baseSpread = 0.05; // 5% default
  
  if (userRiskScore >= 80) {
    baseSpread = 0.02; // 2% for high-trust users
  } else if (userRiskScore >= 60) {
    baseSpread = 0.03; // 3% for medium-trust users
  } else if (userRiskScore >= 40) {
    baseSpread = 0.04; // 4% for low-trust users
  } else {
    baseSpread = 0.07; // 7% for new users
  }

  // Adjust spread based on user type
  switch (userType) {
    case 'Optimizer':
      baseSpread *= 0.8; // 20% tighter spreads for optimizers
      break;
    case 'Trader':
      baseSpread *= 0.9; // 10% tighter spreads for active traders
      break;
    case 'Explorer':
      baseSpread *= 1.2; // 20% wider spreads for explorers (more volatile)
      break;
    case 'Passive':
      baseSpread *= 1.5; // 50% wider spreads for passive users
      break;
  }

  // Calculate suggested price
  const priceMultiplier = orderType === 'buy' ? (1 - baseSpread) : (1 + baseSpread);
  const suggestedPrice = currentPrice * priceMultiplier;
  const pricePercentage = ((suggestedPrice - currentPrice) / currentPrice) * 100;
  
  // Calculate confidence based on risk score
  const confidence = Math.min(95, 60 + (userRiskScore * 0.35));
  
  // Generate reasoning
  const reasoning = generatePriceReasoning(userRiskScore, userType, baseSpread * 100, orderType);

  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    pricePercentage: Math.round(pricePercentage * 100) / 100,
    confidence: Math.round(confidence),
    reasoning
  };
}

// Calculate order success probability
export function calculateOrderSuccessProbability(
  limitPrice: number,
  currentPrice: number,
  userRiskScore: number,
  marketVolatility: number,
  timeToExpiry: number // in hours
): {
  probability: number;
  timeEstimate: string;
  riskFactors: string[];
} {
  const priceDifference = Math.abs((limitPrice - currentPrice) / currentPrice);
  
  // Base probability calculation
  let baseProbability = 50; // 50% base
  
  // Adjust for price difference
  if (priceDifference < 0.01) baseProbability = 90; // 1% difference
  else if (priceDifference < 0.03) baseProbability = 75; // 3% difference
  else if (priceDifference < 0.05) baseProbability = 60; // 5% difference
  else if (priceDifference < 0.10) baseProbability = 40; // 10% difference
  else baseProbability = 20; // >10% difference

  // Adjust for user risk score (higher score = better order placement skills)
  const riskAdjustment = (userRiskScore - 50) * 0.3;
  baseProbability += riskAdjustment;

  // Adjust for market volatility
  const volatilityAdjustment = marketVolatility * 20; // Higher volatility = higher chance
  baseProbability += volatilityAdjustment;

  // Adjust for time to expiry
  const timeAdjustment = Math.min(timeToExpiry / 24, 1) * 10; // More time = better chance
  baseProbability += timeAdjustment;

  // Ensure probability is between 5% and 95%
  const finalProbability = Math.max(5, Math.min(95, baseProbability));

  // Calculate time estimate
  const timeEstimate = calculateTimeEstimate(finalProbability, priceDifference, marketVolatility);

  // Generate risk factors
  const riskFactors = generateRiskFactors(priceDifference, marketVolatility, userRiskScore);

  return {
    probability: Math.round(finalProbability),
    timeEstimate,
    riskFactors
  };
}

// Calculate personalized order recommendations
export function generatePersonalizedRecommendations(
  userRiskScore: number,
  userHealthScore: number,
  userType: string,
  portfolioData: any
): {
  recommendations: Array<{
    type: 'strategy' | 'timing' | 'risk' | 'optimization';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
  }>;
} {
  const recommendations = [];

  // Risk-based recommendations
  if (userRiskScore >= 80) {
    recommendations.push({
      type: 'optimization' as const,
      title: 'Premium Order Features',
      description: 'Your high trust score qualifies you for advanced order types and priority matching.',
      priority: 'high' as const,
      icon: '⭐'
    });
  } else if (userRiskScore < 40) {
    recommendations.push({
      type: 'risk' as const,
      title: 'Build Trading History',
      description: 'Start with smaller orders and conservative spreads to improve your risk profile.',
      priority: 'high' as const,
      icon: '🛡️'
    });
  }

  // Health-based recommendations
  if (userHealthScore < 50) {
    recommendations.push({
      type: 'strategy' as const,
      title: 'Portfolio Diversification',
      description: 'Consider using limit orders to gradually diversify your token holdings.',
      priority: 'medium' as const,
      icon: '📊'
    });
  }

  // User type specific recommendations
  switch (userType) {
    case 'Optimizer':
      recommendations.push({
        type: 'optimization' as const,
        title: 'Gas-Efficient Orders',
        description: 'Use limit orders during low gas periods to maximize your cost efficiency.',
        priority: 'medium' as const,
        icon: '⚡'
      });
      break;
    case 'Trader':
      recommendations.push({
        type: 'strategy' as const,
        title: 'Active Trading Tools',
        description: 'Set multiple limit orders at different price levels for dollar-cost averaging.',
        priority: 'high' as const,
        icon: '📈'
      });
      break;
    case 'Explorer':
      recommendations.push({
        type: 'risk' as const,
        title: 'Research Before Trading',
        description: 'Limit orders give you time to research tokens before committing to trades.',
        priority: 'medium' as const,
        icon: '🔍'
      });
      break;
    case 'Passive':
      recommendations.push({
        type: 'timing' as const,
        title: 'Long-term Orders',
        description: 'Set longer expiry times on your limit orders to catch favorable price movements.',
        priority: 'low' as const,
        icon: '⏰'
      });
      break;
  }

  return { recommendations };
}

// Helper functions
function generatePriceReasoning(riskScore: number, userType: string, spread: number, orderType: string): string {
  const direction = orderType === 'buy' ? 'below' : 'above';
  const action = orderType === 'buy' ? 'buying' : 'selling';
  
  if (riskScore >= 80) {
    return `Your excellent risk score (${riskScore}/100) qualifies you for tight spreads. Suggested ${spread.toFixed(1)}% ${direction} market price for optimal ${action} opportunity.`;
  } else if (riskScore >= 60) {
    return `Your good risk score allows for moderate spreads. ${spread.toFixed(1)}% ${direction} market provides balanced risk-reward for ${action}.`;
  } else {
    return `Conservative ${spread.toFixed(1)}% spread recommended to build trading history and improve your risk profile while ${action}.`;
  }
}

function calculateTimeEstimate(probability: number, priceDiff: number, volatility: number): string {
  if (probability >= 80) return '< 1 hour';
  if (probability >= 60) return '2-6 hours';
  if (probability >= 40) return '6-24 hours';
  if (probability >= 20) return '1-3 days';
  return '3+ days';
}

function generateRiskFactors(priceDiff: number, volatility: number, riskScore: number): string[] {
  const factors = [];
  
  if (priceDiff > 0.05) factors.push('Large price difference from market');
  if (volatility > 0.5) factors.push('High market volatility');
  if (riskScore < 40) factors.push('Limited trading history');
  if (priceDiff > 0.1) factors.push('Aggressive pricing strategy');
  
  return factors;
}
