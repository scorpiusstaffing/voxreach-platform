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
      include: { 
        phoneNumbers: { select: { id: true, number: true, friendlyName: true } },
        tools: { select: { id: true, name: true, type: true } },
      },
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

    // Azure voices
    { provider: 'azure', voiceId: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', accent: 'American' },
    { provider: 'azure', voiceId: 'en-US-GuyNeural', name: 'Guy', gender: 'male', accent: 'American' },
    { provider: 'azure', voiceId: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'female', accent: 'British' },
    { provider: 'azure', voiceId: 'en-AU-NatashaNeural', name: 'Natasha', gender: 'female', accent: 'Australian' },

    // PlayHT voices
    { provider: 'playht', voiceId: 'jennifer', name: 'Jennifer', gender: 'female', accent: 'American' },
    { provider: 'playht', voiceId: 'michael', name: 'Michael', gender: 'male', accent: 'American' },

    // Cartesia voices
    { provider: 'cartesia', voiceId: '248be419-c632-4f23-adf1-5324ed7dbf1f', name: 'British Lady', gender: 'female', accent: 'British' },
    { provider: 'cartesia', voiceId: 'c2ac25f9-ecc4-4f56-9095-651354df60c0', name: 'Morgan', gender: 'male', accent: 'American' },
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
      modelProvider, modelName, temperature, maxTokens,
      transcriberProvider, transcriberModel, transcriberLanguage,
      transcriberConfig,
      language, transferNumber, endCallPhrases, endCallFunctionEnabled,
      maxDurationSeconds, backgroundSound, firstMessageMode,
      voicemailDetection, voicemailMessage, endCallMessage,
      silenceTimeoutSeconds, templateId,
      // Advanced features
      tools, toolIds,
      knowledgeBase,
      analysisPlan,
      voiceChunkPlan, voiceFormatPlan,
      hipaaEnabled, recordingEnabled,
      firstMessageInterruptionsEnabled,
    } = req.body;

    if (!name || !direction || !systemPrompt) {
      return res.status(400).json({ success: false, error: 'name, direction, and systemPrompt are required' });
    }

    // Build webhook URL for this org
    const webhookUrl = config.webhookUrl || `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`;

    // Fetch tool configurations if toolIds provided
    let toolsConfig: any[] = tools || [];
    if (toolIds?.length) {
      const dbTools = await prisma.tool.findMany({
        where: { id: { in: toolIds }, organizationId: req.organizationId },
      });
      
      // Convert DB tools to Vapi format
      toolsConfig = dbTools.map(t => ({
        type: t.type === 'transfer' ? 'transfer' : 'function',
        name: t.name,
        description: t.description,
        parameters: t.parameters || {},
        ...(t.apiEndpoint && {
          server: {
            url: t.apiEndpoint,
            method: t.apiMethod || 'POST',
            headers: t.apiHeaders || {},
          },
        }),
        ...(t.transferNumber && {
          transferConfig: {
            mode: 'number',
            destination: t.transferNumber,
            message: t.transferMessage,
          },
        }),
      }));
    }

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
        voiceChunkPlan,
        voiceFormatPlan,
        modelProvider: modelProvider || 'openai',
        modelName: modelName || 'gpt-4o',
        temperature,
        maxTokens,
        transcriberProvider: transcriberProvider || 'deepgram',
        transcriberModel: transcriberModel || 'nova-3',
        transcriberLanguage: transcriberLanguage || language || 'en',
        transcriberConfig,
        language: language || 'en',
        endCallPhrases: endCallPhrases || [],
        endCallFunctionEnabled,
        transferNumber,
        maxDurationSeconds: maxDurationSeconds || (direction === 'outbound' ? 300 : 600),
        backgroundSound: backgroundSound || (direction === 'outbound' ? 'office' : 'off'),
        firstMessageMode: firstMessageMode || 'assistant-speaks-first',
        voicemailDetection: voicemailDetection ?? (direction === 'outbound'),
        voicemailMessage,
        endCallMessage,
        silenceTimeoutSeconds: silenceTimeoutSeconds || 30,
        serverUrl: webhookUrl,
        tools: toolsConfig,
        knowledgeBase,
        analysisPlan,
        hipaaEnabled,
        recordingEnabled,
        firstMessageInterruptionsEnabled,
      });
    } catch (err: any) {
      console.error('Vapi assistant creation failed:', err);
      return res.status(502).json({ success: false, error: `Failed to create voice agent: ${err.message}` });
    }

    // Build vapiConfig JSON to store extended settings
    const vapiConfig = {
      modelProvider: modelProvider || 'openai',
      modelName: modelName || 'gpt-4o',
      temperature,
      maxTokens,
      voiceSpeed,
      voiceChunkPlan,
      voiceFormatPlan,
      transcriberProvider: transcriberProvider || 'deepgram',
      transcriberModel: transcriberModel || 'nova-3',
      transcriberConfig,
      maxDurationSeconds: maxDurationSeconds || (direction === 'outbound' ? 300 : 600),
      backgroundSound: backgroundSound || (direction === 'outbound' ? 'office' : 'off'),
      firstMessageMode: firstMessageMode || 'assistant-speaks-first',
      voicemailDetection: voicemailDetection ?? (direction === 'outbound'),
      voicemailMessage,
      endCallMessage,
      silenceTimeoutSeconds: silenceTimeoutSeconds || 30,
      endCallFunctionEnabled,
      knowledgeBase,
      analysisPlan,
      hipaaEnabled,
      recordingEnabled,
      firstMessageInterruptionsEnabled,
    };

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
        vapiConfig,
        ...(toolIds?.length && {
          tools: { connect: toolIds.map((id: string) => ({ id })) },
        }),
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
        tools: true,
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
      include: { tools: true },
    });
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    const {
      name, systemPrompt, firstMessage,
      voiceProvider, voiceId, voiceSpeed,
      modelProvider, modelName, temperature, maxTokens,
      language, transferNumber, endCallPhrases, isActive,
      maxDurationSeconds, backgroundSound, firstMessageMode,
      voicemailDetection, voicemailMessage, endCallMessage,
      silenceTimeoutSeconds,
      // Advanced features
      voiceChunkPlan, voiceFormatPlan,
      transcriberConfig,
      endCallFunctionEnabled,
      knowledgeBase,
      analysisPlan,
      hipaaEnabled, recordingEnabled,
      firstMessageInterruptionsEnabled,
      toolIds,
    } = req.body;

    // Get existing vapiConfig and merge updates
    const existingConfig = (agent.vapiConfig as Record<string, any>) || {};
    const updatedVapiConfig = {
      ...existingConfig,
      ...(modelProvider !== undefined && { modelProvider }),
      ...(modelName !== undefined && { modelName }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(voiceSpeed !== undefined && { voiceSpeed }),
      ...(voiceChunkPlan !== undefined && { voiceChunkPlan }),
      ...(voiceFormatPlan !== undefined && { voiceFormatPlan }),
      ...(transcriberConfig !== undefined && { transcriberConfig }),
      ...(maxDurationSeconds !== undefined && { maxDurationSeconds }),
      ...(backgroundSound !== undefined && { backgroundSound }),
      ...(firstMessageMode !== undefined && { firstMessageMode }),
      ...(voicemailDetection !== undefined && { voicemailDetection }),
      ...(voicemailMessage !== undefined && { voicemailMessage }),
      ...(endCallMessage !== undefined && { endCallMessage }),
      ...(silenceTimeoutSeconds !== undefined && { silenceTimeoutSeconds }),
      ...(endCallFunctionEnabled !== undefined && { endCallFunctionEnabled }),
      ...(knowledgeBase !== undefined && { knowledgeBase }),
      ...(analysisPlan !== undefined && { analysisPlan }),
      ...(hipaaEnabled !== undefined && { hipaaEnabled }),
      ...(recordingEnabled !== undefined && { recordingEnabled }),
      ...(firstMessageInterruptionsEnabled !== undefined && { firstMessageInterruptionsEnabled }),
    };

    // Update Vapi assistant if exists
    if (agent.vapiAssistantId) {
      try {
        const vapiUpdate: Record<string, unknown> = {};
        if (name) vapiUpdate.name = `${name} (Voxreach)`;
        if (firstMessage) vapiUpdate.firstMessage = firstMessage;
        if (systemPrompt || modelProvider || modelName || temperature !== undefined || maxTokens !== undefined) {
          vapiUpdate.model = {
            provider: modelProvider || existingConfig.modelProvider || 'openai',
            model: modelName || existingConfig.modelName || 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt || agent.systemPrompt }],
            ...(temperature !== undefined ? { temperature } : existingConfig.temperature !== undefined ? { temperature: existingConfig.temperature } : {}),
            ...(maxTokens !== undefined ? { maxTokens } : existingConfig.maxTokens !== undefined ? { maxTokens: existingConfig.maxTokens } : {}),
          };
        }
        if (voiceProvider || voiceId || voiceSpeed !== undefined || voiceChunkPlan || voiceFormatPlan) {
          vapiUpdate.voice = {
            provider: voiceProvider || agent.voiceProvider,
            voiceId: voiceId || agent.voiceId,
            ...(voiceSpeed !== undefined ? { speed: voiceSpeed } : existingConfig.voiceSpeed !== undefined ? { speed: existingConfig.voiceSpeed } : {}),
            ...(voiceChunkPlan !== undefined ? { chunkPlan: voiceChunkPlan } : existingConfig.voiceChunkPlan ? { chunkPlan: existingConfig.voiceChunkPlan } : {}),
            ...(voiceFormatPlan !== undefined ? { formatPlan: voiceFormatPlan } : existingConfig.voiceFormatPlan ? { formatPlan: existingConfig.voiceFormatPlan } : {}),
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
        if (silenceTimeoutSeconds !== undefined) {
          vapiUpdate.messagePlan = { idleTimeoutSeconds: silenceTimeoutSeconds };
        }
        if (transferNumber !== undefined) {
          vapiUpdate.forwardingPhoneNumber = transferNumber || null;
        }
        if (endCallFunctionEnabled !== undefined) {
          vapiUpdate.endCallFunctionEnabled = endCallFunctionEnabled;
        }
        if (transcriberConfig !== undefined || req.body.transcriberProvider !== undefined) {
          vapiUpdate.transcriber = {
            provider: req.body.transcriberProvider || existingConfig.transcriberProvider || 'deepgram',
            model: req.body.transcriberModel || existingConfig.transcriberModel || 'nova-3',
            language: req.body.transcriberLanguage || language || agent.language || 'en',
            ...(transcriberConfig !== undefined ? transcriberConfig : existingConfig.transcriberConfig || {}),
          };
        }
        if (knowledgeBase !== undefined) {
          vapiUpdate.knowledgeBase = knowledgeBase;
        }
        if (analysisPlan !== undefined) {
          vapiUpdate.analysisPlan = analysisPlan;
        }
        if (hipaaEnabled !== undefined || recordingEnabled !== undefined) {
          vapiUpdate.compliancePlan = {
            ...(hipaaEnabled !== undefined && { hipaaEnabled }),
            ...(recordingEnabled !== undefined && { pciEnabled: false }),
          };
        }
        if (recordingEnabled !== undefined) {
          vapiUpdate.recordingEnabled = recordingEnabled;
        }
        if (firstMessageInterruptionsEnabled !== undefined) {
          vapiUpdate.firstMessageInterruptionsEnabled = firstMessageInterruptionsEnabled;
        }

        // Handle tools update
        if (toolIds !== undefined) {
          if (toolIds.length > 0) {
            const dbTools = await prisma.tool.findMany({
              where: { id: { in: toolIds }, organizationId: req.organizationId },
            });
            const toolsConfig = dbTools.map(t => ({
              type: t.type === 'transfer' ? 'transfer' : 'function',
              name: t.name,
              description: t.description,
              parameters: t.parameters || {},
              ...(t.apiEndpoint && {
                server: {
                  url: t.apiEndpoint,
                  method: t.apiMethod || 'POST',
                  headers: t.apiHeaders || {},
                },
              }),
              ...(t.transferNumber && {
                transferConfig: {
                  mode: 'number',
                  destination: t.transferNumber,
                  message: t.transferMessage,
                },
              }),
            }));
            vapiUpdate.model = {
              ...(vapiUpdate.model || {
                provider: existingConfig.modelProvider || 'openai',
                model: existingConfig.modelName || 'gpt-4o',
                messages: [{ role: 'system', content: agent.systemPrompt }],
              }),
              tools: toolsConfig,
            };
          } else {
            vapiUpdate.model = {
              ...(vapiUpdate.model || {
                provider: existingConfig.modelProvider || 'openai',
                model: existingConfig.modelName || 'gpt-4o',
                messages: [{ role: 'system', content: agent.systemPrompt }],
              }),
              tools: [],
            };
          }
        }

        if (Object.keys(vapiUpdate).length > 0) {
          await vapi.updateAssistant(agent.vapiAssistantId, vapiUpdate);
        }
      } catch (err) {
        console.warn('Vapi update failed (continuing):', err);
      }
    }

    // Build update data for Prisma
    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(firstMessage !== undefined && { firstMessage }),
      ...(voiceProvider !== undefined && { voiceProvider }),
      ...(voiceId !== undefined && { voiceId }),
      ...(language !== undefined && { language }),
      ...(transferNumber !== undefined && { transferNumber }),
      ...(endCallPhrases !== undefined && { endCallPhrases }),
      ...(isActive !== undefined && { isActive }),
      vapiConfig: updatedVapiConfig,
    };

    // Handle tool relations update
    if (toolIds !== undefined) {
      updateData.tools = {
        set: toolIds.map((id: string) => ({ id })),
      };
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: updateData,
      include: { tools: true },
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

    const vapiCall: any = await vapi.createOutboundCall({
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
