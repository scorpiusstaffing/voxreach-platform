import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long');

const urlSchema = z.string().url('Invalid URL');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  organizationName: z.string().min(1, 'Organization name is required').max(100, 'Organization name too long'),
  intent: z.enum(['inbound', 'outbound']),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Agent schemas
export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  voice: z.string().min(1, 'Voice is required'),
  model: z.string().min(1, 'Model is required'),
  firstMessage: z.string().optional(),
  knowledgeBase: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  transferNumber: phoneSchema.optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

// Phone number schemas
export const createPhoneNumberSchema = z.object({
  number: phoneSchema,
  name: z.string().min(1, 'Name is required').max(100),
  assignedAgentId: z.string().uuid('Invalid agent ID').optional(),
});

// Campaign schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  agentId: z.string().uuid('Invalid agent ID'),
  phoneNumberId: z.string().uuid('Invalid phone number ID'),
  schedule: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    timezone: z.string(),
    hours: z.array(z.number().min(0).max(23)),
    daysOfWeek: z.array(z.number().min(0).max(6)),
  }).optional(),
  leads: z.array(z.object({
    name: z.string().min(1, 'Lead name is required'),
    phone: phoneSchema,
    email: emailSchema.optional(),
    customFields: z.record(z.any()).optional(),
  })).min(1, 'At least one lead is required'),
});

// File upload schemas
export const uploadFileSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255),
  content: z.string().min(1, 'File content is required'),
  contentType: z.string().default('application/octet-stream'),
});

// Credential schemas
export const createCredentialSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('twilio'),
    name: z.string().min(1, 'Name is required').max(100),
    accountSid: z.string().min(1, 'Account SID is required'),
    authToken: z.string().min(1, 'Auth Token is required'),
  }),
  z.object({
    provider: z.literal('vonage'),
    name: z.string().min(1, 'Name is required').max(100),
    vonageApiKey: z.string().min(1, 'API Key is required'),
    vonageApiSecret: z.string().min(1, 'API Secret is required'),
  }),
  z.object({
    provider: z.literal('telnyx'),
    name: z.string().min(1, 'Name is required').max(100),
    telnyxApiKey: z.string().min(1, 'API Key is required'),
  }),
  z.object({
    provider: z.literal('byo-sip-trunk'),
    name: z.string().min(1, 'Name is required').max(100),
    gateways: z.array(z.object({
      host: z.string().min(1, 'Gateway host is required'),
      port: z.number().min(1).max(65535),
      protocol: z.enum(['udp', 'tcp', 'tls']),
    })).min(1, 'At least one gateway is required'),
    outboundAuthenticationPlan: z.string().optional(),
    sipTrunkingProvider: z.string().optional(),
  }),
]);

// Webhook validation
export const webhookSignatureSchema = z.object({
  'stripe-signature': z.string().min(1, 'Signature is required'),
});

// Generic ID validation
export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
});

// Validation middleware helper
export function validate<T extends z.ZodType<any>>(schema: T) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: result.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ success: false, error: 'Internal validation error' });
    }
  };
}