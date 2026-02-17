import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'voxreach-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Vapi
  vapiServerKey: process.env.VAPI_SERVER_KEY || '',
  vapiPublicKey: process.env.VAPI_PUBLIC_KEY || '',
  vapiBaseUrl: 'https://api.vapi.ai',
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // App
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  webhookUrl: process.env.WEBHOOK_URL || '',
  
  // Maintenance
  maintenanceToken: process.env.MAINTENANCE_TOKEN || 'maintenance-bypass-token',
};

export function validateConfig() {
  const required = ['databaseUrl', 'vapiServerKey', 'stripeSecretKey'] as const;
  const missing = required.filter((key) => !config[key]);
  
  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing config (ok in dev): ${missing.join(', ')}`);
  }
}
