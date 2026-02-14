// ============================================
// Voxreach Shared Types & Utilities
// ============================================

// --- Enums ---

export enum ProductIntent {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum CallStatus {
  QUEUED = 'queued',
  RINGING = 'ringing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  CANCELED = 'canceled',
}

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum PhoneNumberType {
  LOCAL = 'local',
  TOLL_FREE = 'toll_free',
  MOBILE = 'mobile',
  SIP = 'sip',
}

export enum PhoneNumberProvider {
  VAPI = 'vapi',
  TWILIO = 'twilio',
  BYO = 'byo',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

// --- Interfaces ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  intent: ProductIntent;
  plan: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  organizationId: string;
  name: string;
  vapiAssistantId: string;
  direction: CallDirection;
  voiceProvider: string;
  voiceId: string;
  systemPrompt: string;
  firstMessage: string;
  language: string;
  transferNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhoneNumber {
  id: string;
  organizationId: string;
  number: string;
  type: PhoneNumberType;
  provider: PhoneNumberProvider;
  vapiPhoneNumberId: string;
  assignedAgentId?: string;
  friendlyName?: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Call {
  id: string;
  organizationId: string;
  agentId: string;
  phoneNumberId: string;
  vapiCallId: string;
  direction: CallDirection;
  status: CallStatus;
  fromNumber: string;
  toNumber: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  outcome?: string;
  costCents?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  agentId: string;
  status: CampaignStatus;
  totalLeads: number;
  calledLeads: number;
  successfulCalls: number;
  failedCalls: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  status: 'pending' | 'called' | 'succeeded' | 'failed' | 'skipped';
  callId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Auth Types ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  intent: ProductIntent;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  token: string;
}
