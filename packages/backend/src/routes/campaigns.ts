import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';
import multer from 'multer';
import { parse } from 'csv-parse/sync';

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/campaigns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { organizationId: req.organizationId },
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: campaigns });
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/campaigns
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, agentId } = req.body;
    if (!name || !agentId) {
      return res.status(400).json({ success: false, error: 'name and agentId are required' });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, organizationId: req.organizationId },
    });
    if (!agent) return res.status(400).json({ success: false, error: 'Agent not found' });

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: req.organizationId!,
        name,
        agentId,
      },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/campaigns/:id/leads — upload CSV
router.post('/:id/leads', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    if (!req.file) return res.status(400).json({ success: false, error: 'CSV file required' });

    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const leads = records.map((r: any) => ({
      campaignId: campaign.id,
      organizationId: req.organizationId!,
      name: r.name || r.Name || r.full_name || 'Unknown',
      phone: r.phone || r.Phone || r.phone_number || r.mobile || '',
      email: r.email || r.Email || null,
      company: r.company || r.Company || null,
    })).filter((l: any) => l.phone);

    if (leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid leads found in CSV (need phone column)' });
    }

    await prisma.lead.createMany({ data: leads });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { totalLeads: { increment: leads.length } },
    });

    res.status(201).json({ success: true, data: { imported: leads.length } });
  } catch (err) {
    console.error('Upload leads error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/campaigns/:id/start
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { agent: true },
    });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (!campaign.agent.vapiAssistantId) {
      return res.status(400).json({ success: false, error: 'Agent not configured with Vapi' });
    }

    // Get an available phone number for the org
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { organizationId: req.organizationId, isActive: true },
    });
    if (!phoneNumber?.vapiPhoneNumberId) {
      return res.status(400).json({ success: false, error: 'No phone number available. Provision one first.' });
    }

    // Get pending leads (batch of 10)
    const leads = await prisma.lead.findMany({
      where: { campaignId: campaign.id, status: 'pending' },
      take: 10,
    });

    if (leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No pending leads to call' });
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'active' },
    });

    // Initiate calls for each lead
    const results = [];
    for (const lead of leads) {
      try {
        const vapiCall = await vapi.createOutboundCall({
          assistantId: campaign.agent.vapiAssistantId!,
          phoneNumberId: phoneNumber.vapiPhoneNumberId!,
          customerNumber: lead.phone,
          metadata: { campaignId: campaign.id, leadId: lead.id, organizationId: req.organizationId },
        });

        const call = await prisma.call.create({
          data: {
            organizationId: req.organizationId!,
            agentId: campaign.agentId,
            phoneNumberId: phoneNumber.id,
            campaignId: campaign.id,
            leadId: lead.id,
            vapiCallId: vapiCall.id,
            direction: 'outbound',
            status: 'queued',
            fromNumber: phoneNumber.number,
            toNumber: lead.phone,
          },
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'called', callId: call.id },
        });

        results.push({ leadId: lead.id, callId: call.id, status: 'queued' });
      } catch (err: any) {
        results.push({ leadId: lead.id, status: 'failed', error: err.message });
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'failed' },
        });
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { calledLeads: { increment: results.filter((r) => r.status === 'queued').length } },
    });

    res.json({ success: true, data: { started: results.length, results } });
  } catch (err) {
    console.error('Start campaign error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/campaigns/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: {
        agent: { select: { id: true, name: true } },
        leads: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
