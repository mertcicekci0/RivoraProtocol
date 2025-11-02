/**
 * Data Augmentation Script
 * Mevcut 100 wallet verisini çeşitlendirerek 1000 wallet verisi oluşturur
 * 
 * Usage: npm run augment-data
 */

import * as fs from 'fs';
import * as path from 'path';

interface TrainingSample {
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
 * Add small random variations to create augmented data
 */
function augmentSample(sample: TrainingSample, variation: number = 0.1): TrainingSample {
  const randomVariation = (value: number, varPercent: number) => {
    const variation = (Math.random() * 2 - 1) * varPercent; // -varPercent to +varPercent
    return Math.max(0, value * (1 + variation));
  };

  const clampedVariation = (value: number, min: number, max: number, varPercent: number) => {
    const varied = randomVariation(value, varPercent);
    return Math.max(min, Math.min(max, varied));
  };

  return {
    features: {
      accountAgeDays: Math.round(clampedVariation(sample.features.accountAgeDays, 0, 3650, variation)),
      totalTransactions: Math.round(clampedVariation(sample.features.totalTransactions, 0, 10000, variation)),
      transactionFrequency: clampedVariation(sample.features.transactionFrequency, 0, 1000, variation),
      pathPaymentRatio: clampedVariation(sample.features.pathPaymentRatio, 0, 1, variation),
      assetCount: Math.round(clampedVariation(sample.features.assetCount, 0, 50, variation)),
      portfolioConcentration: clampedVariation(sample.features.portfolioConcentration, 0, 1, variation),
      trustedAssetRatio: clampedVariation(sample.features.trustedAssetRatio, 0, 1, variation),
      successRate: clampedVariation(sample.features.successRate, 0, 1, variation * 0.5), // Less variation for success rate
    },
    riskScore: Math.round(clampedVariation(sample.riskScore, 0, 100, variation) * 10) / 10,
    healthScore: Math.round(clampedVariation(sample.healthScore, 0, 100, variation) * 10) / 10,
  };
}

/**
 * Augment training data to reach target count
 */
function augmentTrainingData(
  originalData: TrainingSample[],
  targetCount: number = 1000
): TrainingSample[] {
  if (originalData.length >= targetCount) {
    console.log(`✅ Already have ${originalData.length} samples, no augmentation needed.`);
    return originalData;
  }

  const augmented: TrainingSample[] = [...originalData]; // Start with original data
  const samplesNeeded = targetCount - originalData.length;
  const samplesPerOriginal = Math.ceil(samplesNeeded / originalData.length);

  console.log(`📊 Augmenting ${originalData.length} samples to ${targetCount}...`);
  console.log(`   Generating ${samplesPerOriginal} variations per original sample...\n`);

  // Create variations with different variation amounts for diversity
  const variationLevels = [0.05, 0.10, 0.15, 0.20]; // Different levels of variation

  for (const original of originalData) {
    if (augmented.length >= targetCount) break;

    // Create multiple variations with different variation levels
    for (let i = 0; i < samplesPerOriginal && augmented.length < targetCount; i++) {
      const variation = variationLevels[i % variationLevels.length];
      const augmentedSample = augmentSample(original, variation);
      augmented.push(augmentedSample);
    }
  }

  // Shuffle to mix original and augmented data
  for (let i = augmented.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [augmented[i], augmented[j]] = [augmented[j], augmented[i]];
  }

  return augmented.slice(0, targetCount);
}

async function augmentData() {
  console.log('🔬 Training Data Augmentation\n');
  console.log('='.repeat(50));

  const dataPath = path.join(process.cwd(), 'training-data.json');
  const outputPath = path.join(process.cwd(), 'training-data-augmented.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ training-data.json not found!');
    console.error('   Please run: npm run collect-data\n');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const originalData: TrainingSample[] = JSON.parse(rawData);

  console.log(`📦 Loaded ${originalData.length} original samples\n`);

  if (originalData.length < 10) {
    console.error('❌ Not enough data to augment (minimum 10 samples required)');
    process.exit(1);
  }

  // Augment to 1000 samples
  const augmentedData = augmentTrainingData(originalData, 1000);

  // Save augmented data
  fs.writeFileSync(outputPath, JSON.stringify(augmentedData, null, 2));

  // Calculate statistics
  const avgRisk = augmentedData.reduce((sum, s) => sum + s.riskScore, 0) / augmentedData.length;
  const avgHealth = augmentedData.reduce((sum, s) => sum + s.healthScore, 0) / augmentedData.length;

  console.log('='.repeat(50));
  console.log(`✅ Augmentation complete!\n`);
  console.log(`📊 Statistics:`);
  console.log(`   Original samples: ${originalData.length}`);
  console.log(`   Augmented samples: ${augmentedData.length}`);
  console.log(`   Average Risk Score: ${avgRisk.toFixed(2)}`);
  console.log(`   Average Health Score: ${avgHealth.toFixed(2)}\n`);
  console.log(`💾 Saved to: ${outputPath}\n`);
  console.log(`💡 To use augmented data, rename the file:`);
  console.log(`   mv ${outputPath} ${dataPath}\n`);

  return augmentedData;
}

// Run if executed directly
if (require.main === module) {
  augmentData()
    .then(() => {
      console.log('🎉 Augmentation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { augmentTrainingData };

