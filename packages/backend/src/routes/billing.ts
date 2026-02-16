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
        id: 'free',
        name: 'Free',
        price: 0,
        priceId: null,
        description: 'Perfect for trying out VoxReach',
        features: [
          '1 AI Agent',
          '50 calls/month',
          'Basic call analytics',
          'Email support',
          '14-day free trial',
        ],
        limits: {
          agents: 1,
          callsPerMonth: 50,
          minutesPerMonth: 100,
          phoneNumbers: 1,
        },
        cta: 'Start Free Trial',
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 99,
        priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
        description: 'For growing businesses',
        features: [
          '3 AI Agents',
          '500 calls/month',
          'Advanced analytics',
          'Priority support',
          'Calendar integration',
          'Basic CRM features',
        ],
        limits: {
          agents: 3,
          callsPerMonth: 500,
          minutesPerMonth: 1000,
          phoneNumbers: 3,
        },
        cta: 'Get Started',
        popular: true,
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 199,
        priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_placeholder',
        description: 'For scaling teams',
        features: [
          '10 AI Agents',
          '2000 calls/month',
          'Advanced analytics & reporting',
          '24/7 priority support',
          'Full CRM integration',
          'Team collaboration',
          'Custom workflows',
          'API access',
        ],
        limits: {
          agents: 10,
          callsPerMonth: 2000,
          minutesPerMonth: 5000,
          phoneNumbers: 10,
        },
        cta: 'Go Professional',
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
        minutesUsed: true,
      },
    });

    res.json({
      ...subscription,
      currentUsage: {
        calls: currentUsage._sum.callsCount || 0,
        minutes: currentUsage._sum.minutesUsed || 0,
      },
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
        minutesUsed: true,
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
        minutesUsed: true,
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

    const plan = subscription?.plan || 'free';
    const plans = {
      free: { calls: 50, minutes: 100 },
      starter: { calls: 500, minutes: 1000 },
      professional: { calls: 2000, minutes: 5000 },
    };

    const limits = plans[plan as keyof typeof plans] || plans.free;

    res.json({
      current: {
        calls: monthlyUsage._sum.callsCount || 0,
        minutes: monthlyUsage._sum.minutesUsed || 0,
      },
      yearly: {
        calls: yearlyUsage._sum.callsCount || 0,
        minutes: yearlyUsage._sum.minutesUsed || 0,
      },
      daily: dailyUsage.map(record => ({
        date: record.date,
        calls: record.callsCount,
        minutes: record.minutesUsed,
      })),
      limits,
      percentageUsed: {
        calls: Math.min(100, Math.round(((monthlyUsage._sum.callsCount || 0) / limits.calls) * 100)),
        minutes: Math.min(100, Math.round(((monthlyUsage._sum.minutesUsed || 0) / limits.minutes) * 100)),
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