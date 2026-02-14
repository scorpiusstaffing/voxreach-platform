import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/agents
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { organizationId: req.organizationId },
      include: { phoneNumbers: { select: { id: true, number: true, friendlyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: agents });
  } catch (err) {
    console.error('List agents error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/agents
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, direction, systemPrompt, firstMessage, voiceProvider, voiceId, language, transferNumber, endCallPhrases } = req.body;

    if (!name || !direction || !systemPrompt) {
      return res.status(400).json({ success: false, error: 'name, direction, and systemPrompt are required' });
    }

    // Create Vapi assistant
    let vapiAssistant: any = null;
    try {
      vapiAssistant = await vapi.createAssistant({
        name: `${name} (Voxreach)`,
        firstMessage: firstMessage || 'Hello, how can I help you today?',
        systemPrompt,
        voice: voiceProvider && voiceId ? { provider: voiceProvider, voiceId } : undefined,
        language: language || 'en',
        endCallPhrases: endCallPhrases || [],
        transferNumber,
      });
    } catch (err) {
      console.error('Vapi assistant creation failed:', err);
      return res.status(502).json({ success: false, error: 'Failed to create voice agent with Vapi' });
    }

    const agent = await prisma.agent.create({
      data: {
        organizationId: req.organizationId!,
        name,
        direction,
        vapiAssistantId: vapiAssistant.id,
        systemPrompt,
        firstMessage: firstMessage || 'Hello, how can I help you today?',
        voiceProvider: voiceProvider || '11labs',
        voiceId: voiceId || 'rachel',
        language: language || 'en',
        transferNumber,
        endCallPhrases: endCallPhrases || [],
      },
    });

    res.status(201).json({ success: true, data: agent });
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/agents/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: {
        phoneNumbers: true,
        calls: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    console.error('Get agent error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/agents/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    const { name, systemPrompt, firstMessage, voiceProvider, voiceId, language, transferNumber, endCallPhrases, isActive } = req.body;

    // Update Vapi assistant if exists
    if (agent.vapiAssistantId) {
      try {
        const vapiUpdate: Record<string, unknown> = {};
        if (name) vapiUpdate.name = `${name} (Voxreach)`;
        if (firstMessage) vapiUpdate.firstMessage = firstMessage;
        if (systemPrompt) {
          vapiUpdate.model = {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }],
          };
        }
        if (voiceProvider && voiceId) vapiUpdate.voice = { provider: voiceProvider, voiceId };
        if (Object.keys(vapiUpdate).length > 0) {
          await vapi.updateAssistant(agent.vapiAssistantId, vapiUpdate);
        }
      } catch (err) {
        console.warn('Vapi update failed (continuing):', err);
      }
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        ...(name !== undefined && { name }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(firstMessage !== undefined && { firstMessage }),
        ...(voiceProvider !== undefined && { voiceProvider }),
        ...(voiceId !== undefined && { voiceId }),
        ...(language !== undefined && { language }),
        ...(transferNumber !== undefined && { transferNumber }),
        ...(endCallPhrases !== undefined && { endCallPhrases }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/agents/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    // Delete from Vapi
    if (agent.vapiAssistantId) {
      try { await vapi.deleteAssistant(agent.vapiAssistantId); } catch {}
    }

    await prisma.agent.delete({ where: { id: agent.id } });
    res.json({ success: true, message: 'Agent deleted' });
  } catch (err) {
    console.error('Delete agent error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
