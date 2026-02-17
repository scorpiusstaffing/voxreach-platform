import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './config';
import { prisma } from './db';
import { apiRateLimit, authRateLimit, publicRateLimit } from './middleware/rateLimit';
import { serviceMode } from './middleware/maintenance';

// Trigger: Force Railway redeploy - ${new Date().toISOString()}

// Routes
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import phoneNumberRoutes from './routes/phoneNumbers';
import credentialRoutes from './routes/credentials';
import callRoutes from './routes/calls';
import campaignRoutes from './routes/campaigns';
import webhookRoutes from './routes/webhooks';
import dashboardRoutes from './routes/dashboard';
import toolRoutes from './routes/tools';
import fileRoutes from './routes/files';
import billingRoutes from './routes/billing';
import blogRoutes from './routes/blog';
// import calendarRoutes from './routes/calendar';

const app = express();

// Maintenance mode (comment out to disable)
app.use(serviceMode);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.frontendUrl, 'https://api.vapi.ai', 'https://api.stripe.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", 'https://js.stripe.com'],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Stripe
}));

// CORS configuration - Strict origin validation
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = config.nodeEnv === 'production'
      ? [
          'https://www.voxreach.io',
          'https://voxreach.io',
          'https://app.voxreach.io',
        ]
      : [
          config.frontendUrl,
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
        ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

app.use(morgan('short'));
app.use(express.json({ limit: '10mb' })); // Limit request size

// Apply rate limiting
app.use('/api/auth', authRateLimit);
app.use('/api', apiRateLimit);

// Health check (no rate limiting)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/phone-numbers', phoneNumberRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/blog', blogRoutes);
// app.use('/api/calendar', calendarRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start
async function main() {
  validateConfig();

  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    if (config.nodeEnv === 'production') process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`🚀 Voxreach API running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });
}

main().catch(console.error);

export default app;
