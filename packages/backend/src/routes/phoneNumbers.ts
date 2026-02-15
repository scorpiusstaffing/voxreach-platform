import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import { config } from '../config';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/phone-numbers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const numbers = await prisma.phoneNumber.findMany({
      where: { organizationId: req.organizationId },
      include: { assignedAgent: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: numbers });
  } catch (err) {
    console.error('List phone numbers error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/phone-numbers/vapi — list all numbers directly from Vapi (for import)
router.get('/vapi', async (req: AuthRequest, res: Response) => {
  try {
    const vapiNumbers = await vapi.listPhoneNumbers();

    // Get existing imported numbers
    const existing = await prisma.phoneNumber.findMany({
      where: { organizationId: req.organizationId },
      select: { vapiPhoneNumberId: true },
    });
    const importedIds = new Set(existing.map((n: any) => n.vapiPhoneNumberId).filter(Boolean));

    // Mark which ones are already imported
    const enriched = (vapiNumbers as any[]).map((n: any) => ({
      ...n,
      imported: importedIds.has(n.id),
    }));

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    console.error('List Vapi numbers error:', err);
    res.status(502).json({ success: false, error: `Failed to fetch Vapi numbers: ${err.message}` });
  }
});

// POST /api/phone-numbers — provision a new number via Vapi
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { friendlyName, assignedAgentId, fallbackNumber } = req.body;

    // Get the agent's Vapi assistant ID if assigning
    let vapiAssistantId: string | undefined;
    if (assignedAgentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: assignedAgentId, organizationId: req.organizationId },
      });
      if (!agent) return res.status(400).json({ success: false, error: 'Agent not found' });
      vapiAssistantId = agent.vapiAssistantId || undefined;
    }

    const webhookUrl = config.webhookUrl || `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`;

    // Provision via Vapi
    let vapiNumber: any;
    try {
      vapiNumber = await vapi.createPhoneNumber({
        name: friendlyName || 'Voxreach Number',
        assistantId: vapiAssistantId,
        serverUrl: webhookUrl,
        fallbackNumber,
      });
    } catch (err: any) {
      console.error('Vapi phone provision failed:', err);
      return res.status(502).json({ success: false, error: `Failed to provision number: ${err.message}` });
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        organizationId: req.organizationId!,
        number: vapiNumber.number || vapiNumber.sipUri || 'pending',
        type: 'local',
        provider: 'vapi',
        vapiPhoneNumberId: vapiNumber.id,
        assignedAgentId,
        friendlyName: friendlyName || null,
        country: 'US',
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: phoneNumber });
  } catch (err) {
    console.error('Create phone number error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/phone-numbers/import — import an existing Vapi phone number
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const { vapiPhoneNumberId, friendlyName, assignedAgentId } = req.body;

    if (!vapiPhoneNumberId) {
      return res.status(400).json({ success: false, error: 'vapiPhoneNumberId is required' });
    }

    // Check if already imported
    const existing = await prisma.phoneNumber.findFirst({
      where: { vapiPhoneNumberId },
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This number is already imported' });
    }

    // Fetch from Vapi
    let vapiNumber: any;
    try {
      vapiNumber = await vapi.getPhoneNumber(vapiPhoneNumberId);
    } catch (err: any) {
      return res.status(502).json({ success: false, error: `Failed to fetch number from Vapi: ${err.message}` });
    }

    // Update Vapi number with webhook and agent if specified
    const webhookUrl = config.webhookUrl || `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`;
    const updatePayload: Record<string, unknown> = {
      server: { url: webhookUrl },
    };

    if (assignedAgentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: assignedAgentId, organizationId: req.organizationId },
      });
      if (agent?.vapiAssistantId) {
        updatePayload.assistantId = agent.vapiAssistantId;
      }
    }

    try {
      await vapi.updatePhoneNumber(vapiPhoneNumberId, updatePayload);
    } catch (err) {
      console.warn('Failed to update Vapi phone with webhook:', err);
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        organizationId: req.organizationId!,
        number: vapiNumber.number || vapiNumber.sipUri || 'unknown',
        type: vapiNumber.provider === 'byo-phone-number' ? 'byo' : 'local',
        provider: vapiNumber.provider || 'vapi',
        vapiPhoneNumberId: vapiNumber.id,
        assignedAgentId: assignedAgentId || null,
        friendlyName: friendlyName || vapiNumber.name || null,
        country: vapiNumber.number?.startsWith('+1') ? 'US' : vapiNumber.number?.startsWith('+65') ? 'SG' : 'US',
        isActive: vapiNumber.status === 'active',
      },
    });

    res.status(201).json({ success: true, data: phoneNumber });
  } catch (err) {
    console.error('Import phone number error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/phone-numbers/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const number = await prisma.phoneNumber.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!number) return res.status(404).json({ success: false, error: 'Phone number not found' });

    const { friendlyName, assignedAgentId, isActive } = req.body;

    // Update Vapi assignment
    if (assignedAgentId !== undefined && number.vapiPhoneNumberId) {
      let vapiAssistantId: string | null = null;
      if (assignedAgentId) {
        const agent = await prisma.agent.findFirst({
          where: { id: assignedAgentId, organizationId: req.organizationId },
        });
        if (!agent) return res.status(400).json({ success: false, error: 'Agent not found' });
        vapiAssistantId = agent.vapiAssistantId;
      }
      try {
        await vapi.updatePhoneNumber(number.vapiPhoneNumberId, {
          assistantId: vapiAssistantId,
        });
      } catch (err) {
        console.warn('Vapi phone update failed:', err);
      }
    }

    const updated = await prisma.phoneNumber.update({
      where: { id: number.id },
      data: {
        ...(friendlyName !== undefined && { friendlyName }),
        ...(assignedAgentId !== undefined && { assignedAgentId: assignedAgentId || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update phone number error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/phone-numbers/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const number = await prisma.phoneNumber.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!number) return res.status(404).json({ success: false, error: 'Phone number not found' });

    // Delete from Vapi (only if we provisioned it)
    if (number.vapiPhoneNumberId && number.provider === 'vapi') {
      try { await vapi.deletePhoneNumber(number.vapiPhoneNumberId); } catch {}
    }

    await prisma.phoneNumber.delete({ where: { id: number.id } });
    res.json({ success: true, message: 'Phone number released' });
  } catch (err) {
    console.error('Delete phone number error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
