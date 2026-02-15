import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/credentials — List org's credentials
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const credentials = await prisma.credential.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: credentials });
  } catch (err) {
    console.error('List credentials error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/credentials — Create a credential
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      provider,
      name,
      // Twilio
      accountSid,
      authToken,
      apiKey,
      apiSecret,
      // Vonage
      vonageApiKey,
      vonageApiSecret,
      // Telnyx
      telnyxApiKey,
      // BYO SIP
      gateways,
      outboundAuthenticationPlan,
      sipTrunkingProvider,
    } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }

    // Validate provider-specific required fields
    if (provider === 'twilio') {
      if (!accountSid || !authToken) {
        return res.status(400).json({ success: false, error: 'Twilio Account SID and Auth Token are required' });
      }
    } else if (provider === 'vonage') {
      if (!vonageApiKey || !vonageApiSecret) {
        return res.status(400).json({ success: false, error: 'Vonage API Key and Secret are required' });
      }
    } else if (provider === 'telnyx') {
      if (!telnyxApiKey) {
        return res.status(400).json({ success: false, error: 'Telnyx API Key is required' });
      }
    } else if (provider === 'byo-sip-trunk') {
      if (!gateways || !Array.isArray(gateways) || gateways.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one gateway is required for BYO SIP Trunk' });
      }
    }

    // Create credential in Vapi
    let vapiCredential: any;
    try {
      vapiCredential = await vapi.createCredential({
        provider,
        name,
        accountSid,
        authToken,
        apiKey,
        apiSecret,
        vonageApiKey,
        vonageApiSecret,
        telnyxApiKey,
        gateways,
        outboundAuthenticationPlan,
        sipTrunkingProvider,
      });
    } catch (err: any) {
      console.error('Vapi credential creation failed:', err);
      return res.status(502).json({ success: false, error: `Failed to create credential: ${err.message}` });
    }

    // Store in local DB
    const credential = await prisma.credential.create({
      data: {
        organizationId: req.organizationId!,
        provider,
        vapiCredentialId: vapiCredential.id,
        name: name || `${provider} credential`,
      },
    });

    res.status(201).json({ success: true, data: credential });
  } catch (err) {
    console.error('Create credential error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/credentials/:id — Delete credential
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const credential = await prisma.credential.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });

    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    // Delete from Vapi
    if (credential.vapiCredentialId) {
      try {
        await vapi.deleteCredential(credential.vapiCredentialId);
      } catch (err) {
        console.warn('Failed to delete credential from Vapi:', err);
      }
    }

    // Delete from local DB
    await prisma.credential.delete({ where: { id: credential.id } });

    res.json({ success: true, message: 'Credential deleted' });
  } catch (err) {
    console.error('Delete credential error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
