import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// GET /api/billing/plans - Get available plans
router.get('/plans', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        price: 49,
        priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
        annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || 'price_starter_annual',
        description: 'Perfect for solo entrepreneurs and small businesses',
        features: [
          '1 AI Agent with custom personality',
          'Custom conversation scripts & prompts',
          'Basic call analytics & recordings',
          'Email support (24hr response)',
          '1 phone number included',
          'Calendar integration (Google/Outlook)',
          'Call transcription',
          'Standard voice quality',
        ],
        limits: {
          agents: 1,
          callsPerMonth: 0, // Feature-based, not usage-based
          minutesPerMonth: 0,
          phoneNumbers: 1,
        },
        cta: 'Start Free Trial',
      },
      {
        id: 'growth',
        name: 'Growth',
        price: 99,
        priceId: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || 'price_growth_monthly',
        annualPriceId: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID || 'price_growth_annual',
        description: 'For scaling teams that need powerful automation',
        features: [
          '5 AI Agents with unique personalities',
          'Advanced script customization & A/B testing',
          'Real-time analytics dashboard',
          'Priority support (4hr response)',
          '5 phone numbers included',
          'Calendar + CRM integration',
          'AI call analysis & sentiment tracking',
          'Team collaboration & role management',
          'Custom workflows & triggers',
          'Premium voices',
          'Voicemail detection & handling',
        ],
        limits: {
          agents: 5,
          callsPerMonth: 0,
          minutesPerMonth: 0,
          phoneNumbers: 5,
        },
        cta: 'Start Free Trial',
        popular: true,
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 199,
        priceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_professional_monthly',
        annualPriceId: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || 'price_professional_annual',
        description: 'Enterprise-grade automation for businesses',
        features: [
          'Unlimited AI Agents',
          'White-label & custom branding',
          'Advanced analytics, reporting & exports',
          '24/7 dedicated support with SLA',
          '20 phone numbers included',
          'Full API access & webhooks',
          'Custom integrations (Zapier, Make, etc.)',
          'Dedicated account manager',
          'SSO & advanced security',
          'Custom AI model fine-tuning',
          'On-premise deployment option',
          'SLA guarantee (99.9% uptime)',
        ],
        limits: {
          agents: 999, // Unlimited
          callsPerMonth: 0,
          minutesPerMonth: 0,
          phoneNumbers: 20,
        },
        cta: 'Start Free Trial',
      },
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// GET /api/billing/subscription - Get current subscription
router.get('/subscription', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organizationId;

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        usageRecords: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!subscription) {
      // Return free plan if no subscription
      return res.json({
        plan: 'free',
        status: 'active',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        invoices: [],
        usageRecords: [],
        limits: {
          agents: 1,
          phoneNumbers: 1,
          calls: 50,
        },
      });
    }

    // Get current usage for the month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentUsage = await prisma.usageRecord.aggregate({
      where: {
        organizationId,
        date: {
          gte: startOfMonth,
        },
      },
      _sum: {
        callsCount: true,
      },
    });

    // Get plan limits
    const planLimits: Record<string, { agents: number; phoneNumbers: number; calls: number }> = {
      free: { agents: 1, phoneNumbers: 1, calls: 50 },
      starter: { agents: 1, phoneNumbers: 1, calls: 500 },
      growth: { agents: 5, phoneNumbers: 5, calls: 2000 },
      professional: { agents: 999, phoneNumbers: 999, calls: 99999 },
      enterprise: { agents: 999, phoneNumbers: 999, calls: 99999 },
    };

    const limits = planLimits[subscription.plan] || planLimits.free;

    res.json({
      ...subscription,
      currentUsage: {
        calls: currentUsage._sum.callsCount || 0,
      },
      limits,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// POST /api/billing/checkout - Create checkout session
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const organizationId = req.organizationId;
    // Need to get user email from database since it's not in the token
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true }
    });
    const userEmail = user?.email;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await (stripe.customers.create as any)({
        email: userEmail || null, // Handle undefined case
        metadata: {
          organizationId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await (stripe.checkout.sessions.create as any)({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${config.frontendUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${config.frontendUrl}/dashboard/billing`,
      metadata: {
        organizationId,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          organizationId,
        },
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/portal - Create billing portal session
router.post('/portal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organizationId;

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeCustomerId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await (stripe.billingPortal.sessions.create as any)({
      customer: subscription.stripeCustomerId,
      return_url: `${config.frontendUrl}/dashboard/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// GET /api/billing/usage - Get current usage
router.get('/usage', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.organizationId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get monthly usage
    const monthlyUsage = await prisma.usageRecord.aggregate({
      where: {
        organizationId,
        date: {
          gte: startOfMonth,
        },
      },
      _sum: {
        callsCount: true,
      },
    });

    // Get yearly usage
    const yearlyUsage = await prisma.usageRecord.aggregate({
      where: {
        organizationId,
        date: {
          gte: startOfYear,
        },
      },
      _sum: {
        callsCount: true,
      },
    });

    // Get daily usage for last 30 days
    const dailyUsage = await prisma.usageRecord.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get subscription for limits
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    // Get current agent count
    const agentCount = await prisma.agent.count({
      where: { organizationId },
    });

    const plan = subscription?.plan || 'free';
    const plans = {
      free: { agents: 1, calls: 50 },
      starter: { agents: 1, calls: 500 },
      growth: { agents: 5, calls: 2000 },
      professional: { agents: 999, calls: 99999 },
      enterprise: { agents: 999, calls: 99999 },
    };

    const limits = plans[plan as keyof typeof plans] || plans.free;

    res.json({
      current: {
        calls: monthlyUsage._sum.callsCount || 0,
        agents: agentCount,
      },
      yearly: {
        calls: yearlyUsage._sum.callsCount || 0,
      },
      daily: dailyUsage.map(record => ({
        date: record.date,
        calls: record.callsCount,
      })),
      limits,
      percentageUsed: {
        calls: limits.calls >= 99999 ? 0 : Math.min(100, Math.round(((monthlyUsage._sum.callsCount || 0) / limits.calls) * 100)),
        agents: Math.min(100, Math.round((agentCount / limits.agents) * 100)),
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// POST /api/billing/track-usage - Track call usage (called from call webhook)
router.post('/track-usage', async (req: Request, res: Response) => {
  try {
    const { organizationId, callsCount = 1, minutesUsed = 0 } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert usage record for today
    await prisma.usageRecord.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: today,
        },
      },
      update: {
        callsCount: { increment: callsCount },
        minutesUsed: { increment: minutesUsed },
      },
      create: {
        organizationId,
        date: today,
        callsCount,
        minutesUsed,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

export default router;