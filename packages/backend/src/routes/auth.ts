import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db';
import { createCustomer } from '../services/stripe';
import { authenticate, AuthRequest } from '../middleware/auth';
import { loginSchema, signupSchema, validate } from '../validation/schemas';

const router = Router();

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationName, intent } = req.validatedData;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create org + user in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: { name: organizationName, intent },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'owner',
          organizationId: org.id,
        },
      });

      // Create Stripe customer
      try {
        const customer = await createCustomer({
          email,
          name: organizationName,
          organizationId: org.id,
        });
        await tx.organization.update({
          where: { id: org.id },
          data: { stripeCustomerId: customer.id },
        });
      } catch (err) {
        console.warn('Stripe customer creation failed (non-fatal):', err);
      }

      return { user, org };
    });

    const token = jwt.sign(
      { userId: result.user.id, organizationId: result.org.id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as any
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
        organization: { id: result.org.id, name: result.org.name, intent: result.org.intent, plan: result.org.plan },
        token,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.validatedData;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        organization: {
          include: {
            subscription: true
          }
        } 
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as any
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          intent: user.organization.intent,
          plan: user.organization.subscription?.plan || 'free',
        },
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token' });
    }

    const decoded = jwt.verify(header.slice(7), config.jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        organization: {
          include: {
            subscription: true
          }
        } 
      },
    });

    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          intent: user.organization.intent,
          plan: user.organization.subscription?.plan || 'free',
        },
      },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// PUT /api/auth/organization - Update organization settings
router.put('/organization', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, intent, plan, vapiKey, stripeCustomerId } = req.body;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (intent !== undefined) updateData.intent = intent;
    // Note: plan is managed via Stripe subscriptions, not direct updates
    // if (plan !== undefined) updateData.plan = plan;
    if (vapiKey !== undefined) updateData.vapiKey = vapiKey;
    if (stripeCustomerId !== undefined) updateData.stripeCustomerId = stripeCustomerId;

    // Update the organization
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        intent: updatedOrg.intent,
        plan: "free", // TODO: Get from subscription
      },
    });
  } catch (err) {
    console.error('Update organization error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/auth/organization - Update organization settings (alternative method)
router.patch('/organization', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, intent, plan, vapiKey, stripeCustomerId } = req.body;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (intent !== undefined) updateData.intent = intent;
    // Note: plan is managed via Stripe subscriptions, not direct updates
    // if (plan !== undefined) updateData.plan = plan;
    if (vapiKey !== undefined) updateData.vapiKey = vapiKey;
    if (stripeCustomerId !== undefined) updateData.stripeCustomerId = stripeCustomerId;

    // Update the organization
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        intent: updatedOrg.intent,
        plan: "free", // TODO: Get from subscription
      },
    });
  } catch (err) {
    console.error('Update organization error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/auth/organization - Update organization settings (same as PUT for compatibility)
router.patch('/organization', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, intent, plan, vapiKey, stripeCustomerId } = req.body;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (intent !== undefined) updateData.intent = intent;
    // Note: plan is managed via Stripe subscriptions, not direct updates
    // if (plan !== undefined) updateData.plan = plan;
    if (vapiKey !== undefined) updateData.vapiKey = vapiKey;
    if (stripeCustomerId !== undefined) updateData.stripeCustomerId = stripeCustomerId;

    // Update the organization
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        intent: updatedOrg.intent,
        plan: "free", // TODO: Get from subscription
      },
    });
  } catch (err) {
    console.error('Update organization error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
