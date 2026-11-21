import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import v1Routes from './routes';

const app: Application = express();

// Enable CORS for client-server communication
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server) or matching CLIENT_URL
      if (!origin || origin === config.clientUrl || origin === 'http://localhost:3000') {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global health probe
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'BuildTrack Backend' });
});

// Mount API v1 router
app.use('/api/v1', v1Routes);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error Middleware]:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
