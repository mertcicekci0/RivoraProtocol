/**
 * Train ML Models from Training Data
 * 
 * Usage:
 *   npx ts-node scripts/train-ml-model.ts
 *   or
 *   npm run train-model
 */

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import to handle TypeScript compilation
// In production, you might need to compile TypeScript first or use a bundler
async function importMLModule() {
  try {
    // Try to import from source (requires ts-node/tsconfig setup)
    const module = await import('../src/lib/server/ml-scoring-model');
    return module;
  } catch (error) {
    console.error('Error importing ML module. Make sure TypeScript is compiled or ts-node is configured.');
    throw error;
  }
}

interface TrainingData {
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

async function trainModels() {
  console.log('🤖 ML Model Training\n');
  console.log('='.repeat(50));

  // Load training data
  const dataPath = path.join(process.cwd(), 'training-data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ training-data.json not found!');
    console.error('   Please run: npm run collect-data\n');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const trainingData: TrainingData[] = JSON.parse(rawData);

  console.log(`📦 Loaded ${trainingData.length} training samples\n`);

  if (trainingData.length < 5) {
    console.error('❌ Not enough training data (minimum 5 samples required)');
    console.error(`   Current: ${trainingData.length} samples\n`);
    process.exit(1);
  }

  // Train models
  const mlModule = await importMLModule();
  const result = await mlModule.trainMLModels(trainingData);

  console.log('='.repeat(50));
  
  if (result.success) {
    console.log('✅ Training completed successfully!\n');
    console.log('📝 Model Summary:');
    console.log(`   Samples: ${trainingData.length}`);
    if (result.riskLoss) {
      console.log(`   Risk Model Loss: ${result.riskLoss.toFixed(4)}`);
    }
    if (result.healthLoss) {
      console.log(`   Health Model Loss: ${result.healthLoss.toFixed(4)}`);
    }
    console.log('\n🎉 Models are ready to use in production!\n');
  } else {
    console.error(`❌ Training failed: ${result.message}\n`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  trainModels()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { trainModels };

