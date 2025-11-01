// Health Check API - Monitor application status
import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    application: 'up' | 'down';
    stellarAPI?: 'up' | 'down'; // ❌ REMOVED: oneinchAPI
    tensorflow: 'up' | 'down';
  };
  version: string;
  uptime: number;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: { 
        application: 'down', 
        tensorflow: 'down' 
      },
      version: '1.0.0',
      uptime: 0
    });
  }

  const healthStatus: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      application: 'up',
      // ❌ REMOVED: oneinchAPI health check
      tensorflow: 'up'
    },
    version: '1.0.0',
    uptime: Date.now() - startTime
  };

  // ❌ REMOVED: 1inch API health check
  // TODO: Add Stellar Horizon API health check

  // TensorFlow.js health check
  try {
    const tf = await import('@tensorflow/tfjs');
    tf.scalar(1).add(tf.scalar(1)).dispose(); // Simple test operation
  } catch (error) {
    console.error('TensorFlow health check failed:', error);
    healthStatus.services.tensorflow = 'down';
    healthStatus.status = 'degraded';
  }


  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503;

  return res.status(statusCode).json(healthStatus);
}