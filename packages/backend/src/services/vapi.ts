import { config } from '../config';

// ============================================
// Vapi API Service — Full Feature Integration
// Direct REST calls — no SDK dependency
// ============================================

const VAPI_BASE = 'https://api.vapi.ai';

const headers = () => ({
  'Authorization': `Bearer ${config.vapiServerKey}`,
  'Content-Type': 'application/json',
});

async function vapiRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vapi API error (${res.status}): ${error}`);
  }

  // DELETE responses may have no body
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return { ok: true };
  }

  return res.json();
}

// ============================================
// Assistants
// ============================================

export interface CreateAssistantParams {
  name: string;
  firstMessage?: string;
  systemPrompt: string;

  // Model config
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;

  // Voice config
  voiceProvider?: string;
  voiceId?: string;
  voiceSpeed?: number;
  voiceChunkPlan?: {
    enabled?: boolean;
    minCharacters?: number;
    punctuationBoundaries?: string[];
  };
  voiceFormatPlan?: {
    format?: string;
    replacements?: Record<string, string>;
  };

  // Transcriber config
  transcriberProvider?: string;
  transcriberModel?: string;
  transcriberLanguage?: string;
  transcriberConfig?: {
    confidenceThreshold?: number;
    wordBoost?: string[];
    keytermsPrompt?: string;
    endUtteranceSilenceThreshold?: number;
    fallbackPlan?: {
      provider?: string;
      model?: string;
    };
  };

  // Call behavior
  language?: string;
  endCallPhrases?: string[];
  endCallFunctionEnabled?: boolean;
  transferNumber?: string;
  transferConfig?: {
    mode?: 'number' | 'assistant' | 'conference';
    destination?: string;
    message?: string;
  };
  maxDurationSeconds?: number;
  backgroundSound?: string;
  firstMessageMode?: string;
  voicemailDetection?: boolean;
  voicemailMessage?: string;
  endCallMessage?: string;
  silenceTimeoutSeconds?: number;

  // Tools
  tools?: Array<{
    type: 'function' | 'transfer' | 'endCall';
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
    async?: boolean;
  }>;

  // Knowledge Base
  knowledgeBase?: {
    provider?: 'canonical' | 'trieve';
    fileIds?: string[];
    searchMode?: 'auto' | 'on-demand';
  };

  // Analysis Plan
  analysisPlan?: {
    summaryPrompt?: string;
    successEvaluation?: string;
    structuredDataSchema?: Record<string, unknown>;
    structuredDataPrompt?: string;
  };

  // Server/webhook config
  serverUrl?: string;

  // Compliance
  hipaaEnabled?: boolean;
  recordingEnabled?: boolean;

  // First message interruptions
  firstMessageInterruptionsEnabled?: boolean;
}

// Map voice provider names to Vapi API expected format
const voiceProviderMap: Record<string, string> = {
  '11labs': 'elevenlabs',
  'elevenlabs': 'elevenlabs',
  'deepgram': 'deepgram',
  'openai': 'openai',
  'vapi': 'vapi',
  'azure': 'azure',
  'playht': 'playht',
  'cartesia': 'cartesia',
};

function mapVoiceProvider(provider: string | undefined): string {
  if (!provider) return 'vapi'; // Default to Vapi's built-in voice to avoid ElevenLabs issues
  return voiceProviderMap[provider] || provider;
}

export async function createAssistant(params: CreateAssistantParams) {
  const body: Record<string, unknown> = {
    name: params.name,
    firstMessage: params.firstMessage || 'Hello, how can I help you today?',

    // Model
    model: {
      provider: params.modelProvider || 'openai',
      model: params.modelName || 'gpt-4o',
      messages: [{ role: 'system', content: params.systemPrompt }],
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens !== undefined && { maxTokens: params.maxTokens }),
    },

    // Voice - map provider names to Vapi API format
    // Default to Vapi's built-in voice to avoid ElevenLabs "Couldn't Find 11labs Voice" error
    voice: {
      provider: mapVoiceProvider(params.voiceProvider),
      voiceId: params.voiceId || 'jennifer', // Vapi built-in voice (was 'rachel' for ElevenLabs)
      ...(params.voiceSpeed !== undefined && { speed: params.voiceSpeed }),
      ...(params.voiceChunkPlan && { chunkPlan: params.voiceChunkPlan }),
      ...(params.voiceFormatPlan && { formatPlan: params.voiceFormatPlan }),
    },

    // Transcriber
    transcriber: {
      provider: params.transcriberProvider || 'deepgram',
      model: params.transcriberModel || 'nova-3',
      language: params.transcriberLanguage || params.language || 'en',
      ...(params.transcriberConfig && {
        ...(params.transcriberConfig.confidenceThreshold !== undefined && {
          confidenceThreshold: params.transcriberConfig.confidenceThreshold,
        }),
        ...(params.transcriberConfig.wordBoost?.length && {
          wordBoost: params.transcriberConfig.wordBoost,
        }),
        ...(params.transcriberConfig.keytermsPrompt && {
          keytermsPrompt: params.transcriberConfig.keytermsPrompt,
        }),
        ...(params.transcriberConfig.endUtteranceSilenceThreshold !== undefined && {
          endUtteranceSilenceThreshold: params.transcriberConfig.endUtteranceSilenceThreshold,
        }),
        ...(params.transcriberConfig.fallbackPlan && {
          fallbackPlan: params.transcriberConfig.fallbackPlan,
        }),
      }),
    },
  };

  // Call behavior
  if (params.maxDurationSeconds) body.maxDurationSeconds = params.maxDurationSeconds;
  if (params.backgroundSound) body.backgroundSound = params.backgroundSound;
  if (params.firstMessageMode) body.firstMessageMode = params.firstMessageMode;
  if (params.firstMessageInterruptionsEnabled !== undefined) {
    body.firstMessageInterruptionsEnabled = params.firstMessageInterruptionsEnabled;
  }
  if (params.endCallPhrases?.length) body.endCallPhrases = params.endCallPhrases;
  if (params.endCallFunctionEnabled !== undefined) {
    body.endCallFunctionEnabled = params.endCallFunctionEnabled;
  }
  if (params.endCallMessage) body.endCallMessage = params.endCallMessage;
  if (params.silenceTimeoutSeconds) {
    body.messagePlan = { idleTimeoutSeconds: params.silenceTimeoutSeconds };
  }

  // Voicemail
  if (params.voicemailDetection) {
    body.voicemailDetection = { provider: 'vapi' };
    if (params.voicemailMessage) body.voicemailMessage = params.voicemailMessage;
  }

  // Transfer
  if (params.transferNumber) {
    body.forwardingPhoneNumber = params.transferNumber;
  }
  if (params.transferConfig) {
    body.transferCallConfig = params.transferConfig;
  }

  // Tools
  if (params.tools?.length) {
    body.model = {
      ...body.model as Record<string, unknown>,
      tools: params.tools,
    };
  }

  // Knowledge Base
  if (params.knowledgeBase?.fileIds?.length) {
    body.knowledgeBase = params.knowledgeBase;
  }

  // Analysis Plan
  if (params.analysisPlan) {
    body.analysisPlan = {
      ...(params.analysisPlan.summaryPrompt && {
        summaryPrompt: params.analysisPlan.summaryPrompt,
      }),
      ...(params.analysisPlan.successEvaluation && {
        successEvaluation: params.analysisPlan.successEvaluation,
      }),
      ...(params.analysisPlan.structuredDataSchema && {
        structuredDataSchema: params.analysisPlan.structuredDataSchema,
      }),
      ...(params.analysisPlan.structuredDataPrompt && {
        structuredDataPrompt: params.analysisPlan.structuredDataPrompt,
      }),
    };
  }

  // Server URL for webhooks
  if (params.serverUrl) {
    body.server = { url: params.serverUrl };
    body.serverUrl = params.serverUrl;
  }

  // Compliance
  if (params.hipaaEnabled) {
    body.compliancePlan = { hipaaEnabled: true, pciEnabled: false };
  }
  if (params.recordingEnabled !== undefined) {
    body.recordingEnabled = params.recordingEnabled;
  }

  // Server messages to receive
  body.serverMessages = [
    'status-update',
    'end-of-call-report',
    'hang',
    'speech-update',
    'transcript',
    'tool-calls',
    'transfer-destination-request',
    'conversation-update',
    'voice-input',
    'speech',
  ];

  return vapiRequest('POST', '/assistant', body);
}

export async function updateAssistant(assistantId: string, params: Record<string, unknown>) {
  return vapiRequest('PATCH', `/assistant/${assistantId}`, params);
}

export async function deleteAssistant(assistantId: string) {
  return vapiRequest('DELETE', `/assistant/${assistantId}`);
}

export async function getAssistant(assistantId: string) {
  return vapiRequest('GET', `/assistant/${assistantId}`);
}

export async function listAssistants() {
  return vapiRequest('GET', '/assistant');
}

// ============================================
// Phone Numbers
// ============================================

export interface CreatePhoneNumberParams {
  name?: string;
  assistantId?: string;
  serverUrl?: string;
  fallbackNumber?: string;
}

export async function createPhoneNumber(params: CreatePhoneNumberParams) {
  const body: Record<string, unknown> = {
    provider: 'vapi',
    name: params.name || 'Voxreach Number',
  };

  if (params.assistantId) body.assistantId = params.assistantId;
  if (params.serverUrl) {
    body.server = { url: params.serverUrl };
  }
  if (params.fallbackNumber) {
    body.fallbackDestination = {
      type: 'number',
      number: params.fallbackNumber,
      message: 'Please hold while we transfer your call.',
    };
  }

  return vapiRequest('POST', '/phone-number', body);
}

export async function importPhoneNumber(params: {
  provider: string;
  number: string;
  credentialId: string;
  name?: string;
  assistantId?: string;
  serverUrl?: string;
}) {
  const body: Record<string, unknown> = {
    provider: 'byo-phone-number',
    number: params.number,
    credentialId: params.credentialId,
    numberE164CheckEnabled: true,
    name: params.name || params.number,
  };

  if (params.assistantId) body.assistantId = params.assistantId;
  if (params.serverUrl) body.server = { url: params.serverUrl };

  return vapiRequest('POST', '/phone-number', body);
}

export async function listPhoneNumbers() {
  return vapiRequest('GET', '/phone-number');
}

export async function getPhoneNumber(phoneNumberId: string) {
  return vapiRequest('GET', `/phone-number/${phoneNumberId}`);
}

export async function updatePhoneNumber(phoneNumberId: string, params: Record<string, unknown>) {
  return vapiRequest('PATCH', `/phone-number/${phoneNumberId}`, params);
}

export async function deletePhoneNumber(phoneNumberId: string) {
  return vapiRequest('DELETE', `/phone-number/${phoneNumberId}`);
}

// ============================================
// Calls
// ============================================

export interface CreateOutboundCallParams {
  assistantId: string;
  phoneNumberId: string;
  customerNumber: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
}

export async function createOutboundCall(params: CreateOutboundCallParams) {
  const body: Record<string, unknown> = {
    assistantId: params.assistantId,
    phoneNumberId: params.phoneNumberId,
    customer: {
      number: params.customerNumber,
      ...(params.customerName && { name: params.customerName }),
    },
  };

  if (params.metadata) body.metadata = params.metadata;

  return vapiRequest('POST', '/call', body);
}

export async function getCall(callId: string) {
  return vapiRequest('GET', `/call/${callId}`);
}

export async function listCalls(params?: { assistantId?: string; phoneNumberId?: string; limit?: number; createdAtGe?: string; createdAtLe?: string }) {
  const query = new URLSearchParams();
  if (params?.assistantId) query.set('assistantId', params.assistantId);
  if (params?.phoneNumberId) query.set('phoneNumberId', params.phoneNumberId);
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.createdAtGe) query.set('createdAtGe', params.createdAtGe);
  if (params?.createdAtLe) query.set('createdAtLe', params.createdAtLe);
  const qs = query.toString();
  return vapiRequest('GET', `/call${qs ? `?${qs}` : ''}`);
}

// ============================================
// Tools
// ============================================

export interface CreateToolParams {
  type: 'function' | 'transfer' | 'endCall';
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  async?: boolean;

  // For function tools
  server?: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
  };

  // For transfer tools
  transferConfig?: {
    mode: 'number' | 'assistant' | 'conference';
    destination: string;
    message?: string;
  };
}

export async function createTool(params: CreateToolParams) {
  const body: Record<string, unknown> = {
    type: params.type,
    function: {
      name: params.name,
      description: params.description,
      ...(params.parameters && { parameters: params.parameters }),
    },
    async: params.async ?? false,
  };

  if (params.server) {
    body.server = params.server;
  }

  if (params.transferConfig) {
    body.transfer = params.transferConfig;
  }

  return vapiRequest('POST', '/tool', body);
}

export async function updateTool(toolId: string, params: Partial<CreateToolParams>) {
  return vapiRequest('PATCH', `/tool/${toolId}`, params);
}

export async function deleteTool(toolId: string) {
  return vapiRequest('DELETE', `/tool/${toolId}`);
}

export async function getTool(toolId: string) {
  return vapiRequest('GET', `/tool/${toolId}`);
}

export async function listTools() {
  return vapiRequest('GET', '/tool');
}

// ============================================
// Files (for Knowledge Base)
// ============================================

export interface UploadFileParams {
  name: string;
  content: Buffer | string;
  contentType?: string;
}

export async function uploadFile(file: UploadFileParams) {
  // For file uploads, we need multipart/form-data
  const formData = new FormData();
  formData.append('name', file.name);
  formData.append('file', new Blob([file.content], { type: file.contentType || 'application/octet-stream' }));

  const res = await fetch(`${VAPI_BASE}/file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.vapiServerKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vapi file upload error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function listFiles() {
  return vapiRequest('GET', '/file');
}

export async function getFile(fileId: string) {
  return vapiRequest('GET', `/file/${fileId}`);
}

export async function deleteFile(fileId: string) {
  return vapiRequest('DELETE', `/file/${fileId}`);
}

// ============================================
// Squads (Multi-agent)
// ============================================

export async function listSquads() {
  return vapiRequest('GET', '/squad');
}

export async function createSquad(params: {
  name: string;
  members: Array<{
    assistantId: string;
    server?: { url: string };
  }>;
}) {
  return vapiRequest('POST', '/squad', params);
}

export async function updateSquad(squadId: string, params: Record<string, unknown>) {
  return vapiRequest('PATCH', `/squad/${squadId}`, params);
}

export async function deleteSquad(squadId: string) {
  return vapiRequest('DELETE', `/squad/${squadId}`);
}

// ============================================
// Credentials (for BYO phone numbers)
// ============================================

export async function listCredentials() {
  return vapiRequest('GET', '/credential');
}

export async function createCredential(params: {
  provider: 'twilio' | 'vonage' | 'telnyx' | '11labs' | 'openai' | 'anthropic' | 'groq';
  name: string;
  apiKey?: string;
  username?: string;
  password?: string;
}) {
  return vapiRequest('POST', '/credential', params);
}

export async function deleteCredential(credentialId: string) {
  return vapiRequest('DELETE', `/credential/${credentialId}`);
}

// ============================================
// Logs
// ============================================

export async function getCallLogs(callId: string) {
  return vapiRequest('GET', `/call/${callId}/logs`);
}
