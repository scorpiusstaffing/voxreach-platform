import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import { config } from '../config';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/phone-numbers — List org's phone numbers
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

// POST /api/phone-numbers — Create/import a phone number
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      provider,
      number,
      friendlyName,
      assignedAgentId,
      fallbackNumber,
      // Twilio-specific
      twilioAccountSid,
      twilioAuthToken,
      // Credential-based providers (vonage, telnyx, byo)
      credentialId,
      // BYO SIP specific
      sipUri,
      numberE164CheckEnabled,
    } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }

    // Validate provider-specific required fields
    if (provider !== 'vapi' && !number && !sipUri) {
      return res.status(400).json({ success: false, error: 'Phone number or SIP URI is required' });
    }

    if (provider === 'twilio') {
      if (!twilioAccountSid || !twilioAuthToken) {
        return res.status(400).json({ success: false, error: 'Twilio Account SID and Auth Token are required' });
      }
    }

    if (provider === 'vonage' || provider === 'telnyx' || provider === 'byo-phone-number') {
      if (!credentialId) {
        return res.status(400).json({ success: false, error: 'Credential ID is required for this provider' });
      }

      // Verify the credential belongs to this organization
      const credential = await prisma.credential.findFirst({
        where: { id: credentialId, organizationId: req.organizationId },
      });
      if (!credential) {
        return res.status(400).json({ success: false, error: 'Invalid credential ID' });
      }
    }

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

    // Create phone number via Vapi
    let vapiNumber: any;
    try {
      vapiNumber = await vapi.createPhoneNumber({
        provider,
        name: friendlyName || (number || sipUri || 'VoxReach Number'),
        number,
        sipUri,
        assistantId: vapiAssistantId,
        serverUrl: webhookUrl,
        fallbackNumber,
        twilioAccountSid,
        twilioAuthToken,
        credentialId,
        numberE164CheckEnabled,
      });
    } catch (err: any) {
      console.error('Vapi phone number creation failed:', err);
      return res.status(502).json({ success: false, error: `Failed to create phone number: ${err.message}` });
    }

    // Check for duplicate (same org + number)
    const existingNumber = number ? await prisma.phoneNumber.findFirst({
      where: { organizationId: req.organizationId, number },
    }) : null;

    if (existingNumber) {
      // Delete the Vapi number we just created since we have a duplicate
      try {
        await vapi.deletePhoneNumber(vapiNumber.id);
      } catch {}
      return res.status(409).json({ success: false, error: 'This phone number is already in your account' });
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        organizationId: req.organizationId!,
        number: vapiNumber.number || vapiNumber.sipUri || number || 'unknown',
        type: provider === 'byo-phone-number' ? 'sip' : 'local',
        provider: provider,
        vapiPhoneNumberId: vapiNumber.id,
        assignedAgentId: assignedAgentId || null,
        friendlyName: friendlyName || vapiNumber.name || null,
        country: vapiNumber.number?.startsWith('+1') ? 'US' : vapiNumber.number?.startsWith('+65') ? 'SG' : 'US',
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
    res.json({ success: true, message: 'Phone number deleted' });
  } catch (err) {
    console.error('Delete phone number error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
