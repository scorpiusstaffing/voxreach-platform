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
  modelProvider?: string;   // openai, anthropic, groq, together-ai, etc.
  modelName?: string;       // gpt-4o, claude-3-opus, llama-3.3-70b-versatile, etc.
  temperature?: number;

  // Voice config
  voiceProvider?: string;   // 11labs, deepgram, openai, azure, vapi, playht, rime-ai, lmnt
  voiceId?: string;
  voiceSpeed?: number;

  // Transcriber config
  transcriberProvider?: string;  // deepgram, assembly-ai, talkscriber
  transcriberModel?: string;     // nova-3, flux-general-en, etc.
  transcriberLanguage?: string;

  // Call behavior
  language?: string;
  endCallPhrases?: string[];
  transferNumber?: string;
  maxDurationSeconds?: number;
  backgroundSound?: string;  // off, office, default
  firstMessageMode?: string; // assistant-speaks-first, assistant-waits-for-user
  voicemailDetection?: boolean;
  voicemailMessage?: string;
  endCallMessage?: string;
  silenceTimeoutSeconds?: number;

  // Server/webhook config
  serverUrl?: string;

  // Knowledge & tools
  hipaaEnabled?: boolean;
  recordingEnabled?: boolean;
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
    },

    // Voice
    voice: {
      provider: params.voiceProvider || '11labs',
      voiceId: params.voiceId || 'rachel',
      ...(params.voiceSpeed !== undefined && { speed: params.voiceSpeed }),
    },

    // Transcriber
    transcriber: {
      provider: params.transcriberProvider || 'deepgram',
      model: params.transcriberModel || 'nova-3',
      language: params.transcriberLanguage || params.language || 'en',
    },
  };

  // Call behavior
  if (params.maxDurationSeconds) body.maxDurationSeconds = params.maxDurationSeconds;
  if (params.backgroundSound) body.backgroundSound = params.backgroundSound;
  if (params.firstMessageMode) body.firstMessageMode = params.firstMessageMode;
  if (params.endCallPhrases?.length) body.endCallPhrases = params.endCallPhrases;
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

  // Server URL for webhooks
  if (params.serverUrl) {
    body.server = { url: params.serverUrl };
    body.serverUrl = params.serverUrl;
  }

  // Compliance
  if (params.hipaaEnabled) {
    body.compliancePlan = { hipaaEnabled: true, pciEnabled: false };
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
// Squads (Multi-agent)
// ============================================

export async function listSquads() {
  return vapiRequest('GET', '/squad');
}

// ============================================
// Credentials (for BYO phone numbers)
// ============================================

export async function listCredentials() {
  return vapiRequest('GET', '/credential');
}

// ============================================
// Logs
// ============================================

export async function getCallLogs(callId: string) {
  return vapiRequest('GET', `/call/${callId}/logs`);
}
