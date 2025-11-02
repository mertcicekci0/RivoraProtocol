// ML Scoring Models using TensorFlow.js
// Trains and uses neural networks for risk and health score prediction

import * as tf from '@tensorflow/tfjs';
import { MLFeatures, normalizeFeatures } from './ml-feature-extractor';

let riskModel: tf.LayersModel | null = null;
let healthModel: tf.LayersModel | null = null;

/**
 * Create a simple neural network for score prediction
 * Architecture: 9 inputs -> 16 hidden -> 8 hidden -> 1 output
 */
function createModel(): tf.Sequential {
  const model = tf.sequential({
    layers: [
      // Input layer: 9 normalized features
      tf.layers.dense({
        inputShape: [9],
        units: 16,
        activation: 'relu',
        name: 'hidden1',
        kernelInitializer: 'heNormal',
      }),
      tf.layers.dropout({ rate: 0.1 }), // Prevent overfitting
      
      // Hidden layer 2
      tf.layers.dense({
        units: 8,
        activation: 'relu',
        name: 'hidden2',
      }),
      
      // Output layer: 1 score value (0-100 range)
      tf.layers.dense({
        units: 1,
        activation: 'linear', // Linear activation for regression
        name: 'output',
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01), // Learning rate
    loss: 'meanSquaredError',
    metrics: ['mae'], // Mean Absolute Error
  });

  return model;
}

/**
 * Train ML models with wallet training data
 * @param trainingData Array of training samples with features and labels
 */
export async function trainMLModels(
  trainingData: Array<{
    features: MLFeatures;
    riskScore: number;
    healthScore: number;
  }>
): Promise<{
  success: boolean;
  riskLoss?: number;
  healthLoss?: number;
  message: string;
}> {
  console.log(`\n🤖 Training ML models with ${trainingData.length} samples...`);

  if (trainingData.length < 5) {
    const message = '⚠️ Not enough training data (minimum 5 samples). Skipping ML training.';
    console.warn(message);
    return {
      success: false,
      message,
    };
  }

  try {
    // Prepare normalized feature data
    const normalizedFeatures = trainingData.map(d => normalizeFeatures(d.features));
    const riskLabels = trainingData.map(d => d.riskScore / 100); // Normalize to 0-1
    const healthLabels = trainingData.map(d => d.healthScore / 100);

    const xs = tf.tensor2d(normalizedFeatures);
    const riskYs = tf.tensor2d(riskLabels, [riskLabels.length, 1]);
    const healthYs = tf.tensor2d(healthLabels, [healthLabels.length, 1]);

    // Create fresh models
    riskModel = createModel();
    healthModel = createModel();

    const batchSize = Math.min(trainingData.length, 32);

    // Train risk score model
    console.log('📊 Training Risk Score model...');
    const riskHistory = await riskModel.fit(xs, riskYs, {
      epochs: 100,
      batchSize,
      validationSplit: 0.2,
      verbose: 0, // Set to 1 for detailed logs
    });

    const riskFinalLoss = riskHistory.history.loss[riskHistory.history.loss.length - 1] as number;

    // Train health score model
    console.log('🏥 Training Health Score model...');
    const healthHistory = await healthModel.fit(xs, healthYs, {
      epochs: 100,
      batchSize,
      validationSplit: 0.2,
      verbose: 0,
    });

    const healthFinalLoss = healthHistory.history.loss[healthHistory.history.loss.length - 1] as number;

    // Cleanup tensors
    xs.dispose();
    riskYs.dispose();
    healthYs.dispose();

    console.log('✅ ML models trained successfully!');
    console.log(`   Risk Model Loss: ${riskFinalLoss.toFixed(4)}`);
    console.log(`   Health Model Loss: ${healthFinalLoss.toFixed(4)}\n`);

    return {
      success: true,
      riskLoss: riskFinalLoss,
      healthLoss: healthFinalLoss,
      message: `Models trained successfully with ${trainingData.length} samples`,
    };

  } catch (error: any) {
    console.error('❌ Error training models:', error);
    return {
      success: false,
      message: `Training failed: ${error.message}`,
    };
  }
}

/**
 * Predict scores using trained ML models
 * Returns null if models are not loaded
 */
export function predictScoresML(features: MLFeatures): {
  riskScore: number | null;
  healthScore: number | null;
} {
  if (!riskModel || !healthModel) {
    return { riskScore: null, healthScore: null };
  }

  try {
    const normalized = normalizeFeatures(features);
    const input = tf.tensor2d([normalized]);

    const riskPred = riskModel.predict(input) as tf.Tensor;
    const healthPred = healthModel.predict(input) as tf.Tensor;

    const riskValue = riskPred.dataSync()[0] * 100; // Denormalize from 0-1 to 0-100
    const healthValue = healthPred.dataSync()[0] * 100;

    // Cleanup
    input.dispose();
    riskPred.dispose();
    healthPred.dispose();

    // Clamp values to valid range
    return {
      riskScore: Math.max(0, Math.min(100, riskValue)),
      healthScore: Math.max(0, Math.min(100, healthValue)),
    };
  } catch (error) {
    console.error('❌ ML prediction error:', error);
    return { riskScore: null, healthScore: null };
  }
}

/**
 * Check if ML models are loaded and ready
 */
export function areModelsLoaded(): boolean {
  return riskModel !== null && healthModel !== null;
}

/**
 * Reset models (useful for retraining)
 */
export function resetModels(): void {
  if (riskModel) {
    riskModel.dispose();
    riskModel = null;
  }
  if (healthModel) {
    healthModel.dispose();
    healthModel = null;
  }
}

