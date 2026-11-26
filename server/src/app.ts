import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { config } from './config/env';
import { auth } from './config/auth';
import v1Routes from './routes';
import { HttpError } from './utils/http-error';

const app: Application = express();

// 1. CORS with credentials and trusted origins for client-server communication
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        config.clientUrl,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];
      // Allow requests with no origin (mobile apps, curl, server-to-server) or matching allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// 2. Mount Better Auth catch-all route BEFORE express.json() (Required by Better Auth)
app.all('/api/auth/*', toNodeHandler(auth));

// 3. Body parsers mounted AFTER Better Auth
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
  const isExpectedError = err instanceof HttpError;
  const statusCode = isExpectedError ? err.statusCode : 500;
  if (!isExpectedError) console.error('[Error Middleware]:', err);
  res.status(statusCode).json({
    success: false,
    message: isExpectedError ? err.message : 'Internal Server Error',
  });
});

export default app;
