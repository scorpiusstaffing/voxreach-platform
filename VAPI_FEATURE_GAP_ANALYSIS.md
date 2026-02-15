# VoxReach ↔ Vapi Feature Gap Analysis

## What We Have (Current State)

### Agent Configuration
- ✅ Name, direction, system prompt, first message
- ✅ Voice selection (11labs, deepgram, openai, vapi) with speed
- ✅ Model selection (openai, anthropic, groq) with temperature
- ✅ Transcriber (deepgram, assembly-ai) with language
- ✅ Background sound (off/office)
- ✅ First message mode (speaks-first / waits-for-user)
- ✅ Max duration, silence timeout
- ✅ Voicemail detection + message
- ✅ End call message
- ✅ Transfer number (forwarding)
- ✅ Templates (5 prebuilt)
- ✅ Create/update/delete with Vapi sync
- ✅ Test calls

### Phone Numbers
- ✅ Provision new Vapi numbers
- ✅ Import existing Vapi numbers
- ✅ Assign agent to number
- ✅ Friendly name, delete

### Calls
- ✅ Outbound calls via agent
- ✅ Call records with status tracking
- ✅ Webhook processing (start/end/transfer/voicemail)
- ✅ Transcripts, recordings, summaries

### Other
- ✅ Campaigns (basic CRUD)
- ✅ Leads
- ✅ Dashboard analytics
- ✅ Auth (JWT)

---

## What Vapi Has That We're Missing

### PRIORITY 1 — High-Impact Features (Must Have)

#### 1. Tool/Function Calling Configuration
Vapi supports attaching tools to assistants that the AI can call during conversations:
- **API Request tools** — call external APIs (CRM, calendar, etc.)
- **Function tools** — server-side function execution
- **Transfer call tool** — structured transfer destinations (not just a single forwarding number)
- **End call tool** — programmatic call ending with conditions
- **Tool messages** — what to say while tool is executing
- Each tool has: name, description, parameters (JSON schema), URL, method, headers, body, timeout

**Implementation needed:**
- Backend: Tool CRUD endpoints, store tool configs, pass tools array to Vapi assistant creation/update
- Frontend: Tool builder UI — name, description, parameter schema editor, API endpoint config
- Vapi service: Include `model.tools` and/or `model.toolIds` in assistant payloads

#### 2. Knowledge Base / File Upload
Vapi assistants can have knowledge bases for RAG:
- Upload files (PDF, docs, text)
- Custom knowledge base with server URL
- `model.knowledgeBase` configuration

**Implementation needed:**
- Backend: File upload endpoint, pass file IDs to Vapi
- Frontend: File upload UI on agent config
- Vapi service: Knowledge base methods

#### 3. Structured Data Extraction (Analysis Plan)
Post-call analysis — extract structured data from conversations:
- `analysisPlan` — summary, success evaluation, structured data extraction
- Custom prompts for analysis
- JSON schema for extracted data

**Implementation needed:**
- Backend: Store analysis plan config, display extracted data on call records
- Frontend: Analysis plan editor on agent config, structured data display on call detail

#### 4. End Call Conditions / Functions
More sophisticated call ending:
- `endCallPhrases` — already have basic version
- `endCallFunctionEnabled` — let AI decide when to end
- End call conditions with rules

**Implementation needed:**
- Backend: Pass endCallFunctionEnabled to Vapi
- Frontend: Toggle + configuration

#### 5. Advanced Transcriber Configuration
Vapi's transcriber has many more options:
- `confidenceThreshold` — minimum confidence for transcription
- `wordBoost` — boost specific words/phrases
- `keytermsPrompt` — key terms for better recognition
- `endUtteranceSilenceThreshold` — silence detection tuning
- `fallbackPlan` — fallback transcriber if primary fails
- More providers: Talkscriber, custom

**Implementation needed:**
- Backend: Pass full transcriber config to Vapi
- Frontend: Advanced transcriber settings section

#### 6. Advanced Voice Configuration
- `chunkPlan` — how text is chunked for TTS (min characters, punctuation boundaries)
- `formatPlan` — number formatting, replacements
- `cachingEnabled` — voice caching
- `fallbackPlan` — fallback voices
- More providers: Azure, PlayHT, Rime-AI, LMNT, Cartesia, Tavus

**Implementation needed:**
- Backend: Pass full voice config
- Frontend: Advanced voice settings

### PRIORITY 2 — Medium-Impact Features

#### 7. Squad / Multi-Agent Support
Multiple agents working together on a call:
- Squad CRUD (we only have `listSquads`)
- Members with transfer conditions
- Squad assignment to phone numbers

**Implementation needed:**
- Backend: Full squad CRUD endpoints
- Frontend: Squad builder UI
- Vapi service: Create/update/delete squad methods

#### 8. Credential Management
Manage API keys for BYO providers:
- Twilio credentials
- ElevenLabs API keys
- Custom provider credentials

**Implementation needed:**
- Backend: Credential CRUD (encrypted storage)
- Frontend: Credentials/integrations page
- Vapi service: Credential methods

#### 9. Transport Configuration
- Twilio transport settings (record, timeout, recording channels)
- SIP configuration
- WebRTC settings

#### 10. Hooks / Event-Driven Actions
- `hooks` — trigger actions on events (call.ending, etc.)
- Execute tools on specific events

#### 11. Observability Plan
- Langfuse integration
- Tags, metadata, prompt versioning

### PRIORITY 3 — Nice-to-Have

#### 12. Advanced Model Configuration
- `maxTokens` — limit response length
- `emotionRecognitionEnabled` — detect caller emotions
- `numFastTurns` — faster initial turns
- `thinking` — chain-of-thought config (Anthropic)

#### 13. Message Plans
- `idleMessages` — what to say during silence
- `messagePlan` — idle timeout messages (we partially have this)

#### 14. First Message Interruptions
- `firstMessageInterruptionsEnabled` — allow user to interrupt first message

#### 15. Compliance
- `compliancePlan` — HIPAA, PCI (we partially have HIPAA)
- `recordingEnabled` — recording toggle

#### 16. Client/Server Messages Configuration
- Choose which webhook events to receive
- Choose which client events to send

---

## What's Broken / Not Working

### 1. Agent Creation
- **Issue**: Works but doesn't store all config fields locally (modelProvider, modelName, temperature, voiceSpeed, maxDuration, etc. aren't in Prisma schema)
- **Fix**: Add missing columns to Agent model or use a JSON `config` column

### 2. Edit Agent Modal
- **Issue**: Missing most advanced settings — only has name, prompt, voice, language, transfer number
- **Fix**: Make edit modal match create modal with all settings

### 3. Phone Number Config
- **Issue**: Edit modal only has friendly name and agent assignment — missing fallback number, server URL config, SIP settings
- **Fix**: Expand edit modal

### 4. Campaigns Page
- **Issue**: Routes exist but frontend may be incomplete
- **Verify**: Check if campaign management UI is fully functional

---

## Implementation Plan (for Kimi K2.5)

### Phase 1: Fix What's Broken + Schema Updates
1. Update Prisma Agent model — add JSON `vapiConfig` column to store all Vapi-specific settings
2. Fix edit agent modal to include ALL settings from create modal
3. Ensure agent create/update actually works end-to-end with Vapi

### Phase 2: Tool/Function Calling (Priority 1)
1. Add Tool model to Prisma (or use Vapi tool IDs directly)
2. Backend: Tool CRUD endpoints + pass tools to Vapi
3. Frontend: Tool builder in agent config (name, description, parameters, API endpoint)
4. Frontend: Tool library page (reusable tools across agents)

### Phase 3: Knowledge Base
1. Backend: File upload endpoint → Vapi files API
2. Backend: Knowledge base config on agent
3. Frontend: File upload + knowledge base toggle on agent config

### Phase 4: Analysis Plan + Structured Data
1. Backend: Store analysis plan on agent, display results on calls
2. Frontend: Analysis plan editor (summary prompt, success criteria, data extraction schema)
3. Frontend: Rich call detail view with extracted data

### Phase 5: Advanced Transcriber + Voice
1. Frontend: Expandable "Advanced Transcriber" section in agent config
2. Frontend: Expandable "Advanced Voice" section
3. Backend: Pass full config to Vapi

### Phase 6: Squads, Credentials, Hooks
1. Squad builder UI + backend
2. Credentials/integrations page
3. Hooks configuration on agent

---

## Technical Notes

- **Project root**: `/Users/jonathan/.openclaw/workspace/Projects/voxreach`
- **Backend**: `packages/backend/src/` — Express + Prisma + TypeScript
- **Frontend**: `packages/frontend/src/` — React + Vite + Tailwind
- **Vapi service**: `packages/backend/src/services/vapi.ts`
- **GitHub**: Push changes to main for Railway auto-deploy
- **Vapi API base**: `https://api.vapi.ai`
- **Vapi Server Key**: `ae8a926a-d8e2-4166-bdc1-8dd2cb87c6a7`

## Design Principles
- Keep the UI user-friendly — business owners, not developers
- Group advanced settings behind expandable sections
- Everything must actually work: create → save → Vapi sync → verify
- Use consistent modal/page patterns from existing codebase
