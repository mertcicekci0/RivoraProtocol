// ML Model Loader
// Automatically loads trained ML models on server startup
// Models are loaded from training data if available

import * as fs from 'fs';
import * as path from 'path';
import { trainMLModels } from './ml-scoring-model';
import { areModelsLoaded } from './ml-scoring-model';

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

let modelsLoading = false;
let modelsLoadPromise: Promise<boolean> | null = null;

/**
 * Load ML models from training data on server startup
 * This ensures models are ready when API is called
 */
export async function loadMLModels(): Promise<boolean> {
  // If models are already loaded, return true
  if (areModelsLoaded()) {
    return true;
  }

  // If models are currently loading, wait for that promise
  if (modelsLoadPromise) {
    return modelsLoadPromise;
  }

  // Start loading models
  modelsLoading = true;
  modelsLoadPromise = (async () => {
    try {
      const dataPath = path.join(process.cwd(), 'training-data.json');
      
      if (!fs.existsSync(dataPath)) {
        console.log('⚠️  training-data.json not found. ML models will not be loaded.');
        console.log('   Run "npm run train-model" to train models.\n');
        modelsLoading = false;
        modelsLoadPromise = null;
        return false;
      }

      console.log('🤖 Loading ML models from training data...');
      
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const trainingData: TrainingSample[] = JSON.parse(rawData);

      if (trainingData.length < 5) {
        console.warn(`⚠️  Not enough training data (${trainingData.length} samples). Need at least 5.`);
        modelsLoading = false;
        modelsLoadPromise = null;
        return false;
      }

      console.log(`📦 Training models with ${trainingData.length} samples...`);
      
      const result = await trainMLModels(trainingData);

      if (result.success) {
        console.log('✅ ML models loaded and ready!\n');
        modelsLoading = false;
        modelsLoadPromise = null;
        return true;
      } else {
        console.warn(`⚠️  Failed to load models: ${result.message}\n`);
        modelsLoading = false;
        modelsLoadPromise = null;
        return false;
      }

    } catch (error: any) {
      console.error('❌ Error loading ML models:', error.message);
      console.log('   Continuing with rule-based scoring...\n');
      modelsLoading = false;
      modelsLoadPromise = null;
      return false;
    }
  })();

  return modelsLoadPromise;
}

/**
 * Check if models are being loaded
 */
export function areModelsLoading(): boolean {
  return modelsLoading;
}

/**
 * Ensure models are loaded (lazy loading on first API call)
 */
export async function ensureModelsLoaded(): Promise<boolean> {
  if (areModelsLoaded()) {
    return true;
  }

  if (modelsLoading || modelsLoadPromise) {
    return modelsLoadPromise || Promise.resolve(false);
  }

  return loadMLModels();
}

