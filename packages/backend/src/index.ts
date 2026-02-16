import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './config';
import { prisma } from './db';

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

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    config.frontendUrl,
    'https://www.voxreach.io',
    'https://voxreach.io',
  ],
  credentials: true
}));
app.use(morgan('short'));
app.use(express.json());

// Health check
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
