/**
 * Collect Training Data from Stellar Network
 * Fetches real wallet data from Horizon API and prepares training dataset
 * 
 * Usage: 
 *   npx ts-node scripts/collect-training-data.ts
 *   or
 *   npm run collect-data
 */

import { Horizon } from '@stellar/stellar-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Note: We'll need to use relative imports from the built files or compile first
// For now, we'll implement the feature extraction inline for the script
const HORIZON_URL = 'https://horizon.stellar.org';

interface TrainingSample {
  walletAddress: string;
  features: {
    accountAgeDays: number;
    totalTransactions: number;
    transactionFrequency: number;
    pathPaymentRatio: number;
    assetCount: number;
    portfolioConcentration: number;
    trustedAssetRatio: number;
    successRate: number;
  };
  riskScore: number;
  healthScore: number;
}

/**
 * Get random wallet addresses from recent ledgers
 * This finds active accounts from the Stellar network
 */
async function getRandomWalletAddresses(count: number = 1000): Promise<string[]> {
  console.log(`\n🔍 Finding ${count} active Stellar wallets...\n`);
  
  const horizon = new Horizon.Server(HORIZON_URL);
  const wallets: Set<string> = new Set();

  try {
    // Strategy: Get wallet addresses from recent operations instead of transactions
    // Operations endpoint gives us more wallet addresses per API call
    
    console.log('📡 Fetching wallet addresses from recent operations...');
    
    // Fetch recent operations (they contain account addresses)
    let cursor = '';
    let iterations = 0;
    const maxIterations = Math.ceil(count / 200); // Each call can give us ~200 unique addresses
    
    while (wallets.size < count && iterations < maxIterations) {
      try {
        const operationsCall = horizon.operations()
          .order('desc')
          .limit(200)
          .cursor(cursor);
        
        const operations = await operationsCall.call();
        
        if (operations.records.length === 0) break;
        
        for (const op of operations.records) {
          if (wallets.size >= count) break;
          
          // Add source account
          if (op.source_account) {
            wallets.add(op.source_account);
          }
          
          // Payment operations
          if (op.type === 'payment') {
            const opData = op as any;
            if (opData.to) wallets.add(opData.to);
          }
          
          // Path payment operations
          if (op.type === 'path_payment_strict_receive' || op.type === 'path_payment_strict_send') {
            const opData = op as any;
            if (opData.destination) wallets.add(opData.destination);
            if (opData.from) wallets.add(opData.from);
          }
          
          // Account merge
          if (op.type === 'account_merge') {
            const opData = op as any;
            if (opData.into) wallets.add(opData.into);
          }
          
          // Create account
          if (op.type === 'create_account') {
            const opData = op as any;
            if (opData.account) wallets.add(opData.account);
          }
        }
        
        // Set cursor for pagination
        if (operations.records.length > 0) {
          cursor = operations.records[operations.records.length - 1].paging_token;
        } else {
          break;
        }
        
        iterations++;
        console.log(`   Progress: ${wallets.size}/${count} wallets found...`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        console.warn(`   Warning: ${error.message}, trying alternative method...`);
        break; // Try fallback method
      }
    }
    
    // Fallback: Also get from recent transactions (if we still need more)
    if (wallets.size < count) {
      console.log(`📡 Fetching additional addresses from transactions...`);
      try {
        const transactions = await horizon.transactions()
          .order('desc')
          .limit(200)
          .call();

        for (const tx of transactions.records) {
          if (wallets.size >= count) break;
          if (tx.source_account) {
            wallets.add(tx.source_account);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    // Note: accounts endpoint may not be available or have restrictions
    // We rely on transaction sources for wallet addresses

    const walletArray = Array.from(wallets).slice(0, count);
    console.log(`✅ Found ${walletArray.length} wallet addresses\n`);
    return walletArray;

  } catch (error: any) {
    console.error('❌ Error fetching wallet addresses:', error.message);
    // Fallback: return some known public addresses
    return getFallbackWalletAddresses(count);
  }
}

/**
 * Fallback: Known public Stellar addresses
 * These are example addresses - replace with real ones if needed
 */
function getFallbackWalletAddresses(count: number): string[] {
  // Known public Stellar addresses for training
  // You can find more at https://stellar.expert/explorer/public
  const knownWallets: string[] = [
    // Add real Stellar public key addresses here (G... format, 56 chars)
    // These are examples - replace with real addresses from Stellar Explorer
    // Stellar Development Foundation example (replace with actual):
    // 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ];

  // If we don't have enough, try to get from recent payments
  if (knownWallets.length < count) {
    console.log(`⚠️  Only ${knownWallets.length} fallback wallets found. Need ${count} for training.`);
    console.log('   Please add more wallet addresses to the script or visit stellar.expert\n');
  }

  if (knownWallets.length === 0) {
    console.warn('⚠️  No fallback wallets provided. Please add wallet addresses manually.');
    console.warn('   Visit https://stellar.expert/explorer/public to find public addresses.\n');
  }

  return knownWallets.slice(0, count);
}

/**
 * Fetch and analyze a single wallet
 */
async function processWallet(
  walletAddress: string,
  horizon: Horizon.Server
): Promise<TrainingSample | null> {
  try {
    // Fetch account data
    const account = await horizon.loadAccount(walletAddress);

    // Calculate account age
    // Note: createdAt() is a method on AccountResponse, TypeScript may not recognize it
    const createdAtStr = (account as any).createdAt ? (account as any).createdAt() : account.last_modified_time;
    const createdAt = new Date(createdAtStr);
    const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Fetch transactions
    const transactionsResponse = await horizon.transactions()
      .forAccount(walletAddress)
      .order('desc')
      .limit(200)
      .call();

    const transactions = transactionsResponse.records;
    const totalTransactions = transactions.length;

    // Fetch operations
    const operationsResponse = await horizon.operations()
      .forAccount(walletAddress)
      .order('desc')
      .limit(200)
      .call();

    const operations = operationsResponse.records;
    const pathPayments = operations.filter(op => 
      op.type === 'path_payment_strict_receive' || op.type === 'path_payment_strict_send'
    ).length;
    const pathPaymentRatio = operations.length > 0 ? pathPayments / operations.length : 0;

    // Calculate transaction frequency
    let transactionFrequency = 0;
    if (transactions.length > 0) {
      const oldestTx = transactions[transactions.length - 1];
      const newestTx = transactions[0];
      const timeSpan = (new Date(newestTx.created_at).getTime() - 
                       new Date(oldestTx.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
      transactionFrequency = totalTransactions / Math.max(timeSpan, 1);
    } else if (accountAgeDays > 0) {
      transactionFrequency = (totalTransactions / accountAgeDays) * 30;
    }

    // Portfolio analysis
    const balances = account.balances;
    const assetCount = Math.max(0, balances.length - 1); // Exclude native XLM

    // Portfolio concentration (HHI)
    let portfolioConcentration = 1.0;
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

    // Trusted assets
    const trustedAssets = ['XLM', 'USDC', 'USDT'];
    const trustedCount = balances.filter(b => {
      // Native XLM
      if (b.asset_type === 'native') return true;
      // Other assets (check if it has asset_code property)
      const assetCode = (b as any).asset_code;
      if (assetCode) {
        return trustedAssets.includes(assetCode);
      }
      return false;
    }).length;
    const trustedAssetRatio = balances.length > 0 ? trustedCount / balances.length : 0;

    // Success rate (simplified)
    const successRate = totalTransactions > 0 ? 1.0 : 0;

    // Calculate scores using rule-based system (these will be labels)
    // Simplified scoring for training data generation
    let walletAgeScore = 20;
    if (accountAgeDays >= 1095) walletAgeScore = 100;
    else if (accountAgeDays >= 365) walletAgeScore = 80;
    else if (accountAgeDays >= 90) walletAgeScore = 60;
    else if (accountAgeDays >= 30) walletAgeScore = 40;

    let transactionFrequencyScore = 10;
    if (totalTransactions >= 500) transactionFrequencyScore = 100;
    else if (totalTransactions >= 200) transactionFrequencyScore = 80;
    else if (totalTransactions >= 50) transactionFrequencyScore = 60;
    else if (totalTransactions >= 10) transactionFrequencyScore = 40;

    const secureSwapUsageScore = 50 + (pathPaymentRatio * 30);
    const tokenTrustworthinessScore = 30 + (trustedAssetRatio * 70);

    // Calculate risk score (weighted average)
    const riskScore = 
      walletAgeScore * 0.25 +
      transactionFrequencyScore * 0.20 +
      secureSwapUsageScore * 0.20 +
      tokenTrustworthinessScore * 0.35;

    // Calculate health score (simplified)
    const tokenDiversityScore = assetCount === 1 ? 30 :
                               assetCount < 5 ? 50 :
                               assetCount < 10 ? 70 :
                               assetCount < 20 ? 85 : 100;

    const portfolioConcentrationScore = (1 - portfolioConcentration) * 100;
    const tokenAgeAverageScore = 30 + (trustedAssetRatio * 70);
    const volatilityExposureScore = 20 + (trustedAssetRatio * 80);
    const gasEfficiencyScore = 70; // Stellar has low fees

    const healthScore = 
      tokenDiversityScore * 0.30 +
      portfolioConcentrationScore * 0.25 +
      tokenAgeAverageScore * 0.15 +
      volatilityExposureScore * 0.20 +
      gasEfficiencyScore * 0.10;

    const features = {
      accountAgeDays: Math.min(accountAgeDays, 3650),
      totalTransactions: Math.min(totalTransactions, 10000),
      transactionFrequency: Math.min(transactionFrequency, 1000),
      pathPaymentRatio,
      assetCount: Math.min(assetCount, 50),
      portfolioConcentration,
      trustedAssetRatio,
      successRate,
    };

    return {
      walletAddress,
      features,
      riskScore: Math.round(riskScore * 10) / 10,
      healthScore: Math.round(healthScore * 10) / 10,
    };

  } catch (error: any) {
    if (error.response?.status === 404) {
      // Account doesn't exist
      return null;
    }
    throw error;
  }
}

/**
 * Main function to collect training data
 */
async function collectTrainingData() {
  console.log('🚀 Stellar Training Data Collection\n');
  console.log('=' .repeat(50));

  const horizon = new Horizon.Server(HORIZON_URL);
  const trainingSamples: TrainingSample[] = [];

  // Get wallet addresses
  // Set WALLET_COUNT environment variable for custom count
  // Default: 100 wallets (good balance for hackathon)
  // Set TEST_MODE=true for quick testing with 10 wallets
  const testMode = process.env.TEST_MODE === 'true';
  const walletCountEnv = process.env.WALLET_COUNT ? parseInt(process.env.WALLET_COUNT, 10) : null;
  const walletCount = walletCountEnv || (testMode ? 10 : 100); // Default 100 wallet
  const walletAddresses = await getRandomWalletAddresses(walletCount);
  
  if (walletCount >= 500) {
    console.log(`🎯 JÜRİ MODU: ${walletCount} wallet ile büyük dataset eğitimi`);
    console.log(`   Bu işlem 30-60 dakika sürebilir...\n`);
  } else if (testMode) {
    console.log('🧪 TEST MODE: Only collecting 10 wallets for quick testing\n');
  }

  if (walletAddresses.length === 0) {
    console.error('❌ No wallet addresses found. Please add wallet addresses manually.\n');
    process.exit(1);
  }

  console.log('📊 Processing wallets...\n');
  console.log(`🎯 Target: ${walletAddresses.length} wallets (aiming for quality training data)\n`);

  // Process wallets with progress tracking
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const batchSize = 50; // Process in batches for better progress tracking

  for (let i = 0; i < walletAddresses.length; i++) {
    const walletAddress = walletAddresses[i];
    const displayAddress = `${walletAddress.substring(0, 8)}...${walletAddress.substring(48)}`;
    
    // Progress indicator every 10 wallets
    if (i % 10 === 0 || i === walletAddresses.length - 1) {
      const progress = ((i + 1) / walletAddresses.length * 100).toFixed(1);
      process.stdout.write(`\r⏳ Progress: ${i + 1}/${walletAddresses.length} (${progress}%) | ✅ ${successCount} | ⏭️ ${skipCount} | ❌ ${errorCount}`);
    }

    try {
      const sample = await processWallet(walletAddress, horizon);
      
      if (sample) {
        trainingSamples.push(sample);
        successCount++;
      } else {
        skipCount++;
      }

      // Reduced delay for faster collection (1000 wallets takes time)
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error: any) {
      errorCount++;
      // Don't spam errors for large batches
      if (i % 100 === 0) {
        console.log(`\n⚠️  Error at ${i + 1}: ${error.message}`);
      }
    }

    // Save progress every 100 wallets (backup)
    if ((i + 1) % 100 === 0 && trainingSamples.length > 0) {
      const backupPath = path.join(process.cwd(), `training-data-backup-${i + 1}.json`);
      const outputData = trainingSamples.map(s => ({
        features: s.features,
        riskScore: s.riskScore,
        healthScore: s.healthScore,
      }));
      fs.writeFileSync(backupPath, JSON.stringify(outputData, null, 2));
      console.log(`\n💾 Backup saved: ${backupPath} (${trainingSamples.length} samples)`);
    }
  }

  console.log('\n'); // New line after progress

  // Save training data
  if (trainingSamples.length > 0) {
    const outputPath = path.join(process.cwd(), 'training-data.json');
    
    const outputData = trainingSamples.map(s => ({
      features: s.features,
      riskScore: s.riskScore,
      healthScore: s.healthScore,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Collected ${trainingSamples.length} training samples`);
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`💾 Saved to: ${outputPath}\n`);
    
    // Statistics about the data
    if (trainingSamples.length > 0) {
      const avgRisk = trainingSamples.reduce((sum, s) => sum + s.riskScore, 0) / trainingSamples.length;
      const avgHealth = trainingSamples.reduce((sum, s) => sum + s.healthScore, 0) / trainingSamples.length;
      console.log(`📈 Average Scores:`);
      console.log(`   Risk Score: ${avgRisk.toFixed(2)}`);
      console.log(`   Health Score: ${avgHealth.toFixed(2)}\n`);
    }
    
    return trainingSamples;
  } else {
    console.error('\n❌ No training data collected. Please check wallet addresses.\n');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  collectTrainingData()
    .then(() => {
      console.log('🎉 Data collection complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { collectTrainingData };

