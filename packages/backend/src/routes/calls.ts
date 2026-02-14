import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/calls
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agentId, status, direction, limit = '50', offset = '0' } = req.query;

    const where: any = { organizationId: req.organizationId };
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;
    if (direction) where.direction = direction;

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          phoneNumber: { select: { id: true, number: true, friendlyName: true } },
          lead: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.call.count({ where }),
    ]);

    res.json({ success: true, data: calls, total });
  } catch (err) {
    console.error('List calls error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/calls — initiate an outbound call
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agentId, phoneNumberId, customerNumber, customerName, metadata } = req.body;

    if (!agentId || !customerNumber) {
      return res.status(400).json({ success: false, error: 'agentId and customerNumber are required' });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, organizationId: req.organizationId },
    });
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    if (!agent.vapiAssistantId) return res.status(400).json({ success: false, error: 'Agent not synced with Vapi' });

    // Find a phone number to use
    let fromNumber;
    if (phoneNumberId) {
      fromNumber = await prisma.phoneNumber.findFirst({
        where: { id: phoneNumberId, organizationId: req.organizationId, isActive: true },
      });
    } else {
      // Auto-select: prefer numbers assigned to this agent, then any active number
      fromNumber = await prisma.phoneNumber.findFirst({
        where: { assignedAgentId: agentId, organizationId: req.organizationId, isActive: true },
      }) || await prisma.phoneNumber.findFirst({
        where: { organizationId: req.organizationId, isActive: true },
      });
    }

    if (!fromNumber?.vapiPhoneNumberId) {
      return res.status(400).json({ success: false, error: 'No phone number available. Provision or import one first.' });
    }

    // Initiate via Vapi
    let vapiCall: any;
    try {
      vapiCall = await vapi.createOutboundCall({
        assistantId: agent.vapiAssistantId,
        phoneNumberId: fromNumber.vapiPhoneNumberId,
        customerNumber,
        customerName,
        metadata: { ...metadata, organizationId: req.organizationId },
      });
    } catch (err: any) {
      console.error('Vapi call initiation failed:', err);
      return res.status(502).json({ success: false, error: `Failed to initiate call: ${err.message}` });
    }

    // Create local record
    const call = await prisma.call.create({
      data: {
        organizationId: req.organizationId!,
        agentId: agent.id,
        phoneNumberId: fromNumber.id,
        vapiCallId: vapiCall.id,
        direction: 'outbound',
        status: 'queued',
        fromNumber: fromNumber.number,
        toNumber: customerNumber,
        metadata: metadata || null,
      },
    });

    res.status(201).json({ success: true, data: { call, vapiCall } });
  } catch (err) {
    console.error('Create call error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calls/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: {
        agent: { select: { id: true, name: true } },
        phoneNumber: { select: { id: true, number: true, friendlyName: true } },
        lead: true,
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!call) return res.status(404).json({ success: false, error: 'Call not found' });

    // Optionally fetch live status from Vapi
    let vapiData = null;
    if (call.vapiCallId && ['queued', 'ringing', 'in_progress'].includes(call.status)) {
      try {
        vapiData = await vapi.getCall(call.vapiCallId);
      } catch (err) {
        console.warn('Failed to fetch Vapi call:', err);
      }
    }

    res.json({ success: true, data: { ...call, vapiCall: vapiData } });
  } catch (err) {
    console.error('Get call error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calls/:id/transcript
router.get('/:id/transcript', async (req: AuthRequest, res: Response) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      select: { transcript: true, vapiCallId: true, status: true },
    });

    if (!call) return res.status(404).json({ success: false, error: 'Call not found' });

    // If we have a stored transcript, return it
    if (call.transcript) {
      return res.json({ success: true, data: { transcript: call.transcript } });
    }

    // Otherwise try to fetch from Vapi
    if (call.vapiCallId) {
      try {
        const vapiCall = await vapi.getCall(call.vapiCallId);
        if (vapiCall.transcript || vapiCall.artifact?.transcript) {
          const transcript = vapiCall.transcript || vapiCall.artifact?.transcript;
          // Cache it locally
          await prisma.call.update({
            where: { id: req.params.id },
            data: { transcript },
          });
          return res.json({ success: true, data: { transcript } });
        }
      } catch (err) {
        console.warn('Failed to fetch transcript from Vapi:', err);
      }
    }

    res.json({ success: true, data: { transcript: null } });
  } catch (err) {
    console.error('Get transcript error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
