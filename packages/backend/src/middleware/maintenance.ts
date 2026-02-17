import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Set this to true to enable maintenance mode
const MAINTENANCE_MODE = true;

// List of endpoints that should still work during maintenance
const ALLOWED_ENDPOINTS = [
  '/health',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/me',
];

// List of IP addresses that can bypass maintenance mode (admins, developers)
const BYPASS_IPS = [
  '127.0.0.1',
  '::1',
  // Add production admin IPs here
];

export function maintenanceMode(req: Request, res: Response, next: NextFunction) {
  // Skip maintenance mode in development
  if (config.nodeEnv === 'development') {
    return next();
  }

  // Skip if maintenance mode is disabled
  if (!MAINTENANCE_MODE) {
    return next();
  }

  // Check if this is an allowed endpoint
  const isAllowedEndpoint = ALLOWED_ENDPOINTS.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  if (isAllowedEndpoint) {
    return next();
  }

  // Check if IP is allowed to bypass
  const clientIp = req.ip || req.socket.remoteAddress;
  if (clientIp && BYPASS_IPS.includes(clientIp)) {
    return next();
  }

  // Check for maintenance bypass token (for emergency access)
  const maintenanceToken = req.headers['x-maintenance-token'];
  if (maintenanceToken === config.maintenanceToken) {
    return next();
  }

  // Return maintenance response
  res.status(503).json({
    success: false,
    error: 'Service temporarily unavailable',
    message: 'VoxReach is currently undergoing maintenance. Please check back soon.',
    estimatedRestoration: '2026-03-01T00:00:00Z',
    statusPage: 'https://status.voxreach.io',
    supportEmail: 'support@voxreach.io',
  });
}

// Alternative: Graceful degradation mode (read-only)
export function readOnlyMode(req: Request, res: Response, next: NextFunction) {
  // Skip in development
  if (config.nodeEnv === 'development') {
    return next();
  }

  // Check if this is a read operation
  const isReadOperation = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  
  if (!isReadOperation) {
    res.status(503).json({
      success: false,
      error: 'Service in read-only mode',
      message: 'VoxReach is currently in read-only mode for maintenance. Write operations are temporarily disabled.',
      allowedOperations: ['GET', 'HEAD', 'OPTIONS'],
    });
    return;
  }

  next();
}

// Combined middleware: use maintenance mode or read-only mode
export function serviceMode(req: Request, res: Response, next: NextFunction) {
  if (MAINTENANCE_MODE) {
    return maintenanceMode(req, res, next);
  }
  
  // If you want read-only mode instead, uncomment:
  // return readOnlyMode(req, res, next);
  
  next();
}