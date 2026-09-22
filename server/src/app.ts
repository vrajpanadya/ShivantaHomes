import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { env, isProduction } from './config/env';
import { apiLimiter } from './middleware/rateLimit';
import { notFound, errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import enquiryRoutes from './routes/enquiries';
import siteVisitRoutes from './routes/siteVisits';
import mediaRoutes from './routes/media';
import activityRoutes from './routes/activity';
import dashboardRoutes from './routes/dashboard';
import contentRoutes from './routes/content';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          mediaSrc: ["'self'", 'https:'],
          connectSrc: ["'self'", 'https:'],
          frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com', 'https://www.openstreetmap.org'],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
    })
  );

  const allowed = [env.CLIENT_URL, ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])].filter(Boolean);
  app.use(
    cors({
      origin: (origin, cb) => {
        // Same-origin / server-to-server requests carry no Origin header.
        if (!origin || allowed.some((o) => origin === o || origin.endsWith(new URL(o).host))) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  if (!isProduction) app.use(morgan('dev'));

  // Locally stored media fallback (Cloudinary URLs are absolute and need no static route)
  app.use('/media', express.static(path.join(process.cwd(), 'public', 'media'), { maxAge: '7d' }));

  app.get('/api/health', (_req, res) => res.json({ success: true, service: 'shivanta-homes-api', time: new Date().toISOString() }));

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use('/api/site-visits', siteVisitRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/activity-logs', activityRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api', contentRoutes());

  // Serve the built client in production
  const clientDist = path.join(process.cwd(), '..', 'client', 'dist');
  if (isProduction && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/|media\/).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
