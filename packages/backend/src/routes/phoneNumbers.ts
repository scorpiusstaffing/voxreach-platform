import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
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

// POST /api/phone-numbers — provision a new number via Vapi
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { friendlyName, assignedAgentId, type } = req.body;

    // Get the agent's Vapi assistant ID if assigning
    let vapiAssistantId: string | undefined;
    if (assignedAgentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: assignedAgentId, organizationId: req.organizationId },
      });
      if (!agent) return res.status(400).json({ success: false, error: 'Agent not found' });
      vapiAssistantId = agent.vapiAssistantId || undefined;
    }

    // Provision via Vapi
    let vapiNumber: any;
    try {
      vapiNumber = await vapi.createPhoneNumber({
        name: friendlyName || 'Voxreach Number',
        assistantId: vapiAssistantId,
      });
    } catch (err: any) {
      console.error('Vapi phone provision failed:', err);
      return res.status(502).json({ success: false, error: `Failed to provision number: ${err.message}` });
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        organizationId: req.organizationId!,
        number: vapiNumber.number || vapiNumber.sipUri || 'pending',
        type: type || 'local',
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

    // Delete from Vapi
    if (number.vapiPhoneNumberId) {
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
