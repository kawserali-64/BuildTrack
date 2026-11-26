import mongoose from 'mongoose';
import { config } from './env';
import { mongoClient } from './auth';

// Mongoose connection for application & business models (Projects, Tasks, Budgets, etc.)
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB/Mongoose] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    console.warn('[MongoDB/Mongoose] Notice:', error instanceof Error ? error.message : error);
  }

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB/Mongoose] Connection established.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB/Mongoose] Connection disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB/Mongoose] Runtime error:', err);
  });
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB/Mongoose] Disconnected.');
  }
  try {
    await mongoClient.close();
    console.log('[MongoDB/BetterAuth] Native client closed.');
  } catch {
    // Ignore close if not connected
  }
};
