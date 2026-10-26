import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import v1Routes from './routes/v1';
import { errorHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible UI script & image rendering
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS - Supports Local Development and Render Cloud Deployment
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or same-origin requests)
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          env.FRONTEND_URL,
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ];
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.onrender.com') ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
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

  // Serve Frontend Static Build (Production / Render Deployment)
  const possibleDistPaths = [
    path.resolve(__dirname, '../../web/dist'),
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(process.cwd(), 'car_rental/apps/web/dist'),
  ];
  const webDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

  if (webDistPath) {
    app.use(express.static(webDistPath));
    app.get('*', (req, res, next) => {
      // Do not intercept API or health endpoints
      if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
        return next();
      }
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  // Catch-all 404 for unmatched API routes
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
