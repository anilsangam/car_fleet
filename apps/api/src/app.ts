import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import v1Routes from './routes/v1';
import { errorHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible local UI testing
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request Parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Logging in development
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health probe
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      time: new Date().toISOString(),
      service: 'EliteRide Car Booking API',
    });
  });

  // Mount API v1
  app.use('/api/v1', v1Routes);

  // Catch-all 404
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

