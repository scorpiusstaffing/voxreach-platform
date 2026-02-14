import { config } from '../config';

// ============================================
// Vapi API Service
// Direct REST calls — no SDK dependency
// ============================================

const headers = () => ({
  'Authorization': `Bearer ${config.vapiServerKey}`,
  'Content-Type': 'application/json',
});

async function vapiRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${config.vapiBaseUrl}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vapi API error (${res.status}): ${error}`);
  }

  return res.json();
}

// --- Assistants ---

export async function createAssistant(params: {
  name: string;
  firstMessage: string;
  systemPrompt: string;
  voice?: { provider: string; voiceId: string };
  language?: string;
  endCallPhrases?: string[];
  transferNumber?: string;
}) {
  const body: Record<string, unknown> = {
    name: params.name,
    firstMessage: params.firstMessage,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: params.systemPrompt }],
    },
    voice: params.voice || { provider: '11labs', voiceId: 'rachel' },
    language: params.language || 'en',
  };

  if (params.endCallPhrases?.length) {
    body.endCallPhrases = params.endCallPhrases;
  }

  if (params.transferNumber) {
    body.forwardingPhoneNumber = params.transferNumber;
  }

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

// --- Phone Numbers ---

export async function createPhoneNumber(params: {
  name?: string;
  assistantId?: string;
  numberType?: string;
}) {
  const body: Record<string, unknown> = {
    provider: 'vapi',
    name: params.name || 'Voxreach Number',
  };

  if (params.assistantId) {
    body.assistantId = params.assistantId;
  }

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

// --- Calls ---

export async function createOutboundCall(params: {
  assistantId: string;
  phoneNumberId: string;
  customerNumber: string;
  metadata?: Record<string, unknown>;
}) {
  return vapiRequest('POST', '/call', {
    assistantId: params.assistantId,
    phoneNumberId: params.phoneNumberId,
    customer: { number: params.customerNumber },
    metadata: params.metadata,
  });
}

export async function getCall(callId: string) {
  return vapiRequest('GET', `/call/${callId}`);
}

export async function listCalls(params?: { assistantId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.assistantId) query.set('assistantId', params.assistantId);
  if (params?.limit) query.set('limit', params.limit.toString());
  const qs = query.toString();
  return vapiRequest('GET', `/call${qs ? `?${qs}` : ''}`);
}
