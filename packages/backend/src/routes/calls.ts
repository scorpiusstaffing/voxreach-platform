import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/calls
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agentId, status, direction, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

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
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.call.count({ where }),
    ]);

    res.json({
      success: true,
      data: calls,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('List calls error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/calls/outbound — make a single outbound call
router.post('/outbound', async (req: AuthRequest, res: Response) => {
  try {
    const { agentId, phoneNumberId, toNumber } = req.body;

    if (!agentId || !phoneNumberId || !toNumber) {
      return res.status(400).json({ success: false, error: 'agentId, phoneNumberId, and toNumber are required' });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, organizationId: req.organizationId },
    });
    if (!agent || !agent.vapiAssistantId) {
      return res.status(400).json({ success: false, error: 'Agent not found or not configured' });
    }

    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { id: phoneNumberId, organizationId: req.organizationId },
    });
    if (!phoneNumber || !phoneNumber.vapiPhoneNumberId) {
      return res.status(400).json({ success: false, error: 'Phone number not found or not configured' });
    }

    // Initiate call via Vapi
    let vapiCall: any;
    try {
      vapiCall = await vapi.createOutboundCall({
        assistantId: agent.vapiAssistantId,
        phoneNumberId: phoneNumber.vapiPhoneNumberId,
        customerNumber: toNumber,
        metadata: { organizationId: req.organizationId, agentId },
      });
    } catch (err: any) {
      console.error('Vapi outbound call failed:', err);
      return res.status(502).json({ success: false, error: `Failed to initiate call: ${err.message}` });
    }

    // Record call in DB
    const call = await prisma.call.create({
      data: {
        organizationId: req.organizationId!,
        agentId,
        phoneNumberId,
        vapiCallId: vapiCall.id,
        direction: 'outbound',
        status: 'queued',
        fromNumber: phoneNumber.number,
        toNumber,
      },
    });

    res.status(201).json({ success: true, data: call });
  } catch (err) {
    console.error('Outbound call error:', err);
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
      },
    });
    if (!call) return res.status(404).json({ success: false, error: 'Call not found' });
    res.json({ success: true, data: call });
  } catch (err) {
    console.error('Get call error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
