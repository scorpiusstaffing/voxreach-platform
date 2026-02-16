import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './auth';

export async function checkAgentLimit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organizationId = req.organizationId;
    
    // Get subscription for organization
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    const plan = subscription?.plan || 'starter';
    const planLimits = {
      starter: { agents: 1, phoneNumbers: 1 },
      growth: { agents: 5, phoneNumbers: 5 },
      professional: { agents: 999, phoneNumbers: 20 }, // Unlimited agents
    };

    const limit = planLimits[plan as keyof typeof planLimits] || planLimits.starter;

    // Count current agents
    const agentCount = await prisma.agent.count({
      where: { organizationId },
    });

    if (agentCount >= limit.agents) {
      return res.status(403).json({
        error: 'Agent limit reached',
        message: `You have reached the limit of ${limit.agents} AI agent${limit.agents !== 1 ? 's' : ''} on your ${plan} plan.`,
        currentCount: agentCount,
        limit: limit.agents,
        plan,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    console.error('Error checking agent limit:', error);
    res.status(500).json({ error: 'Failed to check agent limit' });
  }
}

export async function checkPhoneNumberLimit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organizationId = req.organizationId;
    
    // Get subscription for organization
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    const plan = subscription?.plan || 'starter';
    const planLimits = {
      starter: { phoneNumbers: 1 },
      growth: { phoneNumbers: 5 },
      professional: { phoneNumbers: 20 },
    };

    const limit = planLimits[plan as keyof typeof planLimits] || planLimits.starter;

    // Count current phone numbers
    const phoneNumberCount = await prisma.phoneNumber.count({
      where: { organizationId },
    });

    if (phoneNumberCount >= limit.phoneNumbers) {
      return res.status(403).json({
        error: 'Phone number limit reached',
        message: `You have reached the limit of ${limit.phoneNumbers} phone number${limit.phoneNumbers !== 1 ? 's' : ''} on your ${plan} plan.`,
        currentCount: phoneNumberCount,
        limit: limit.phoneNumbers,
        plan,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    console.error('Error checking phone number limit:', error);
    res.status(500).json({ error: 'Failed to check phone number limit' });
  }
}

export async function getPlanLimits(req: AuthRequest, res: Response) {
  try {
    const organizationId = req.organizationId;
    
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    const plan = subscription?.plan || 'starter';
    const planLimits = {
      starter: { agents: 1, phoneNumbers: 1 },
      growth: { agents: 5, phoneNumbers: 5 },
      professional: { agents: 999, phoneNumbers: 20 },
    };

    const limits = planLimits[plan as keyof typeof planLimits] || planLimits.starter;

    // Get current counts
    const [agentCount, phoneNumberCount] = await Promise.all([
      prisma.agent.count({ where: { organizationId } }),
      prisma.phoneNumber.count({ where: { organizationId } }),
    ]);

    res.json({
      plan,
      limits,
      currentUsage: {
        agents: agentCount,
        phoneNumbers: phoneNumberCount,
      },
      remaining: {
        agents: Math.max(0, limits.agents - agentCount),
        phoneNumbers: Math.max(0, limits.phoneNumbers - phoneNumberCount),
      },
      upgradeRequired: {
        agents: agentCount >= limits.agents,
        phoneNumbers: phoneNumberCount >= limits.phoneNumbers,
      },
    });
  } catch (error) {
    console.error('Error getting plan limits:', error);
    res.status(500).json({ error: 'Failed to get plan limits' });
  }
}