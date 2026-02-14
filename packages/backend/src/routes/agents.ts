import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import { config } from '../config';
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

// GET /api/agents/templates — pre-built agent templates
router.get('/templates', async (_req: AuthRequest, res: Response) => {
  const templates = [
    {
      id: 'sales-outbound',
      name: 'Sales Outreach Agent',
      direction: 'outbound',
      systemPrompt: `You are a professional sales representative. Your goal is to qualify leads, understand their needs, and book appointments.\n\nRules:\n- Be friendly and professional\n- Ask ONE question at a time\n- Listen carefully to responses\n- If interested, book a meeting\n- If not interested, thank them politely\n- Keep the call under 3 minutes`,
      firstMessage: 'Hi, this is {{agentName}} from {{company}}. I\'m reaching out because we help businesses like yours {{value_prop}}. Do you have a quick moment?',
      voiceProvider: '11labs',
      voiceId: 'rachel',
      backgroundSound: 'office',
      maxDurationSeconds: 300,
      firstMessageMode: 'assistant-speaks-first',
      voicemailDetection: true,
      voicemailMessage: 'Hi, this is {{agentName}} from {{company}}. I was calling to discuss how we can help your business. Please call us back at your convenience.',
    },
    {
      id: 'recruitment-caller',
      name: 'Recruitment Caller',
      direction: 'outbound',
      systemPrompt: `You are an AI recruitment assistant. You're calling hiring managers to present qualified candidates.\n\nRules:\n- Be direct and professional\n- Quickly explain who you are and why you're calling\n- Present the candidate briefly (role, experience level)\n- Ask if they're open to seeing the CV\n- If yes, confirm best email\n- Keep it under 2 minutes`,
      firstMessage: 'Hi, this is {{agentName}} from {{company}}. I\'m reaching out because we have a strong candidate for a role that might be relevant to your team. Are you the right person to discuss this with?',
      voiceProvider: 'deepgram',
      voiceId: 'asteria',
      backgroundSound: 'office',
      maxDurationSeconds: 180,
      firstMessageMode: 'assistant-speaks-first',
      voicemailDetection: true,
    },
    {
      id: 'receptionist-inbound',
      name: 'AI Receptionist',
      direction: 'inbound',
      systemPrompt: `You are a friendly AI receptionist. You answer incoming calls, help with common questions, capture lead information, and transfer to the right department when needed.\n\nRules:\n- Always greet warmly\n- Ask how you can help\n- For appointments: collect name, email, preferred date/time\n- For questions: answer from your knowledge base\n- For complex issues: offer to transfer to a human\n- Always confirm information back to the caller`,
      firstMessage: 'Thank you for calling {{company}}. How can I help you today?',
      voiceProvider: '11labs',
      voiceId: 'rachel',
      backgroundSound: 'off',
      maxDurationSeconds: 600,
      firstMessageMode: 'assistant-speaks-first',
    },
    {
      id: 'appointment-booker',
      name: 'Appointment Booking Agent',
      direction: 'inbound',
      systemPrompt: `You are an appointment scheduling assistant. You help callers book, reschedule, or cancel appointments.\n\nRules:\n- Collect: name, phone, email, preferred date/time, reason for visit\n- Offer 2-3 available time slots\n- Confirm all details back\n- Send confirmation details\n- Be patient and clear, especially with dates and times`,
      firstMessage: 'Hi! I can help you schedule an appointment. What type of appointment are you looking for?',
      voiceProvider: 'vapi',
      voiceId: 'Elliot',
      backgroundSound: 'off',
      maxDurationSeconds: 600,
      firstMessageMode: 'assistant-speaks-first',
    },
    {
      id: 'lead-qualifier',
      name: 'Lead Qualification Agent',
      direction: 'outbound',
      systemPrompt: `You are a lead qualification specialist. Your job is to call leads, ask qualifying questions, and determine if they're a good fit.\n\nQualification criteria:\n- Budget: Do they have budget allocated?\n- Authority: Are they the decision maker?\n- Need: Do they have the problem you solve?\n- Timeline: When are they looking to implement?\n\nRules:\n- Ask questions naturally, not like a survey\n- ONE question at a time\n- If qualified, book a demo call\n- If not qualified, thank them and end politely`,
      firstMessage: 'Hi {{leadName}}, this is {{agentName}} from {{company}}. You recently expressed interest in {{product}}. I wanted to learn more about what you\'re looking for. Do you have a couple minutes?',
      voiceProvider: '11labs',
      voiceId: 'drew',
      backgroundSound: 'office',
      maxDurationSeconds: 300,
      firstMessageMode: 'assistant-speaks-first',
      voicemailDetection: true,
    },
  ];

  res.json({ success: true, data: templates });
});

// GET /api/agents/voice-options — available voices
router.get('/voice-options', async (_req: AuthRequest, res: Response) => {
  const voiceOptions = [
    // ElevenLabs voices
    { provider: '11labs', voiceId: 'rachel', name: 'Rachel', gender: 'female', accent: 'American' },
    { provider: '11labs', voiceId: 'drew', name: 'Drew', gender: 'male', accent: 'American' },
    { provider: '11labs', voiceId: 'clyde', name: 'Clyde', gender: 'male', accent: 'American' },
    { provider: '11labs', voiceId: 'sarah', name: 'Sarah', gender: 'female', accent: 'American' },
    { provider: '11labs', voiceId: 'domi', name: 'Domi', gender: 'female', accent: 'American' },
    { provider: '11labs', voiceId: 'dave', name: 'Dave', gender: 'male', accent: 'British' },
    { provider: '11labs', voiceId: 'fin', name: 'Fin', gender: 'male', accent: 'Irish' },
    { provider: '11labs', voiceId: 'glinda', name: 'Glinda', gender: 'female', accent: 'American' },

    // Deepgram voices
    { provider: 'deepgram', voiceId: 'asteria', name: 'Asteria', gender: 'female', accent: 'American' },
    { provider: 'deepgram', voiceId: 'luna', name: 'Luna', gender: 'female', accent: 'American' },
    { provider: 'deepgram', voiceId: 'stella', name: 'Stella', gender: 'female', accent: 'American' },
    { provider: 'deepgram', voiceId: 'athena', name: 'Athena', gender: 'female', accent: 'American' },
    { provider: 'deepgram', voiceId: 'hera', name: 'Hera', gender: 'female', accent: 'American' },
    { provider: 'deepgram', voiceId: 'orion', name: 'Orion', gender: 'male', accent: 'American' },
    { provider: 'deepgram', voiceId: 'arcas', name: 'Arcas', gender: 'male', accent: 'American' },
    { provider: 'deepgram', voiceId: 'perseus', name: 'Perseus', gender: 'male', accent: 'American' },

    // Vapi built-in voices
    { provider: 'vapi', voiceId: 'Elliot', name: 'Elliot', gender: 'male', accent: 'American' },
    { provider: 'vapi', voiceId: 'Lily', name: 'Lily', gender: 'female', accent: 'American' },

    // OpenAI voices
    { provider: 'openai', voiceId: 'alloy', name: 'Alloy', gender: 'neutral', accent: 'American' },
    { provider: 'openai', voiceId: 'echo', name: 'Echo', gender: 'male', accent: 'American' },
    { provider: 'openai', voiceId: 'fable', name: 'Fable', gender: 'male', accent: 'British' },
    { provider: 'openai', voiceId: 'onyx', name: 'Onyx', gender: 'male', accent: 'American' },
    { provider: 'openai', voiceId: 'nova', name: 'Nova', gender: 'female', accent: 'American' },
    { provider: 'openai', voiceId: 'shimmer', name: 'Shimmer', gender: 'female', accent: 'American' },
  ];

  res.json({ success: true, data: voiceOptions });
});

// GET /api/agents/model-options — available AI models
router.get('/model-options', async (_req: AuthRequest, res: Response) => {
  const modelOptions = [
    { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o', description: 'Best quality, higher cost' },
    { provider: 'openai', model: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Good quality, lower cost' },
    { provider: 'openai', model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast, lowest cost' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Excellent quality' },
    { provider: 'groq', model: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Very fast, great value' },
    { provider: 'groq', model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Ultra fast, lowest latency' },
  ];

  res.json({ success: true, data: modelOptions });
});

// POST /api/agents
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, direction, systemPrompt, firstMessage,
      voiceProvider, voiceId, voiceSpeed,
      modelProvider, modelName, temperature,
      transcriberProvider, transcriberModel, transcriberLanguage,
      language, transferNumber, endCallPhrases,
      maxDurationSeconds, backgroundSound, firstMessageMode,
      voicemailDetection, voicemailMessage, endCallMessage,
      silenceTimeoutSeconds, templateId,
    } = req.body;

    if (!name || !direction || !systemPrompt) {
      return res.status(400).json({ success: false, error: 'name, direction, and systemPrompt are required' });
    }

    // Build webhook URL for this org
    const webhookUrl = config.webhookUrl || `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`;

    // Create Vapi assistant
    let vapiAssistant: any = null;
    try {
      vapiAssistant = await vapi.createAssistant({
        name: `${name} (Voxreach)`,
        firstMessage: firstMessage || 'Hello, how can I help you today?',
        systemPrompt,
        voiceProvider: voiceProvider || '11labs',
        voiceId: voiceId || 'rachel',
        voiceSpeed,
        modelProvider: modelProvider || 'openai',
        modelName: modelName || 'gpt-4o',
        temperature,
        transcriberProvider: transcriberProvider || 'deepgram',
        transcriberModel: transcriberModel || 'nova-3',
        transcriberLanguage: transcriberLanguage || language || 'en',
        language: language || 'en',
        endCallPhrases: endCallPhrases || [],
        transferNumber,
        maxDurationSeconds: maxDurationSeconds || (direction === 'outbound' ? 300 : 600),
        backgroundSound: backgroundSound || (direction === 'outbound' ? 'office' : 'off'),
        firstMessageMode: firstMessageMode || 'assistant-speaks-first',
        voicemailDetection: voicemailDetection ?? (direction === 'outbound'),
        voicemailMessage,
        endCallMessage,
        silenceTimeoutSeconds: silenceTimeoutSeconds || 30,
        serverUrl: webhookUrl,
      });
    } catch (err: any) {
      console.error('Vapi assistant creation failed:', err);
      return res.status(502).json({ success: false, error: `Failed to create voice agent: ${err.message}` });
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

    res.status(201).json({ success: true, data: { ...agent, vapiAssistant } });
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
        calls: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    // Also fetch live Vapi assistant data
    let vapiData = null;
    if (agent.vapiAssistantId) {
      try {
        vapiData = await vapi.getAssistant(agent.vapiAssistantId);
      } catch (err) {
        console.warn('Failed to fetch Vapi assistant:', err);
      }
    }

    res.json({ success: true, data: { ...agent, vapiAssistant: vapiData } });
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

    const {
      name, systemPrompt, firstMessage,
      voiceProvider, voiceId, voiceSpeed,
      modelProvider, modelName, temperature,
      language, transferNumber, endCallPhrases, isActive,
      maxDurationSeconds, backgroundSound, firstMessageMode,
      voicemailDetection, voicemailMessage, endCallMessage,
      silenceTimeoutSeconds,
    } = req.body;

    // Update Vapi assistant if exists
    if (agent.vapiAssistantId) {
      try {
        const vapiUpdate: Record<string, unknown> = {};
        if (name) vapiUpdate.name = `${name} (Voxreach)`;
        if (firstMessage) vapiUpdate.firstMessage = firstMessage;
        if (systemPrompt || modelProvider || modelName || temperature !== undefined) {
          vapiUpdate.model = {
            provider: modelProvider || 'openai',
            model: modelName || 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt || agent.systemPrompt }],
            ...(temperature !== undefined && { temperature }),
          };
        }
        if (voiceProvider || voiceId || voiceSpeed !== undefined) {
          vapiUpdate.voice = {
            provider: voiceProvider || agent.voiceProvider,
            voiceId: voiceId || agent.voiceId,
            ...(voiceSpeed !== undefined && { speed: voiceSpeed }),
          };
        }
        if (maxDurationSeconds) vapiUpdate.maxDurationSeconds = maxDurationSeconds;
        if (backgroundSound) vapiUpdate.backgroundSound = backgroundSound;
        if (firstMessageMode) vapiUpdate.firstMessageMode = firstMessageMode;
        if (endCallMessage) vapiUpdate.endCallMessage = endCallMessage;
        if (voicemailDetection !== undefined) {
          vapiUpdate.voicemailDetection = voicemailDetection ? { provider: 'vapi' } : 'off';
        }
        if (voicemailMessage) vapiUpdate.voicemailMessage = voicemailMessage;
        if (silenceTimeoutSeconds) {
          vapiUpdate.messagePlan = { idleTimeoutSeconds: silenceTimeoutSeconds };
        }
        if (transferNumber !== undefined) {
          vapiUpdate.forwardingPhoneNumber = transferNumber || null;
        }

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

// POST /api/agents/:id/test-call — make a test call with this agent
router.post('/:id/test-call', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { phoneNumbers: true },
    });
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    if (!agent.vapiAssistantId) return res.status(400).json({ success: false, error: 'Agent not synced with Vapi' });

    const { phoneNumber } = req.body; // customer number to call
    if (!phoneNumber) return res.status(400).json({ success: false, error: 'phoneNumber is required' });

    // Find a phone number for this agent (or any org number)
    const fromNumber = agent.phoneNumbers[0] || await prisma.phoneNumber.findFirst({
      where: { organizationId: req.organizationId, isActive: true },
    });

    if (!fromNumber?.vapiPhoneNumberId) {
      return res.status(400).json({ success: false, error: 'No phone number available. Provision one first.' });
    }

    const vapiCall = await vapi.createOutboundCall({
      assistantId: agent.vapiAssistantId,
      phoneNumberId: fromNumber.vapiPhoneNumberId,
      customerNumber: phoneNumber,
      metadata: { source: 'test-call', organizationId: req.organizationId },
    });

    // Create local call record
    const call = await prisma.call.create({
      data: {
        organizationId: req.organizationId!,
        agentId: agent.id,
        phoneNumberId: fromNumber.id,
        vapiCallId: vapiCall.id,
        direction: 'outbound',
        status: 'queued',
        fromNumber: fromNumber.number,
        toNumber: phoneNumber,
        metadata: { source: 'test-call' },
      },
    });

    res.status(201).json({ success: true, data: { call, vapiCall } });
  } catch (err: any) {
    console.error('Test call error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to initiate test call' });
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
