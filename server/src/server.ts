import app from './app';
import { config } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { seedAdmin } from './utils/seedAdmin';

const startServer = async (): Promise<void> => {
  // Start Express HTTP listener immediately so server is always available
  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 BuildTrack API Server running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Allowed Client URL: ${config.clientUrl}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}/api/v1/health`);
    console.log(`===============================================`);
  });

  // Connect to MongoDB then seed the first Admin account (idempotent)
  connectDB()
    .then(() => seedAdmin())
    .catch((err) => {
      console.warn('[MongoDB] Connection initialization warning:', err.message);
    });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}. Closing server and database...`);
    server.close(async () => {
      await disconnectDB();
      console.log('[Shutdown] Server successfully terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
