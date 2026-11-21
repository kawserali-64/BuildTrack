import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    console.warn('[MongoDB] Connection notice:', error instanceof Error ? error.message : error);
    console.warn(`[MongoDB] API is running. Database operations will activate once MongoDB is running at ${config.mongodbUri}`);
  }

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connection established.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Runtime error:', err);
  });
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected.');
  }
};
