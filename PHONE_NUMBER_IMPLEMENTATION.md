# Phone Number Feature — Complete Implementation Spec

## Problem
The current phone numbers page exposes Jonathan's own Vapi numbers (internal infrastructure). Clients should NEVER see those. Instead, clients need to **create/import their OWN phone numbers** through Vapi's API using their own provider credentials (Twilio, Vonage, Telnyx, BYO SIP Trunk).

## Architecture Overview
VoxReach is a shell app over Vapi's API. All phone number operations go through Vapi — we store a local reference in our DB for UI/assignment purposes.

### Vapi Phone Number Providers (from API testing)
Vapi supports these phone number providers:
1. **`vapi`** — Free Vapi-provisioned US numbers (for testing/dev)
2. **`twilio`** — Import from Twilio (needs Twilio Account SID + Auth Token + API Key + API Secret)
3. **`vonage`** — Import from Vonage (needs `credentialId` — credential created first with API Key + API Secret)
4. **`telnyx`** — Import from Telnyx (needs `credentialId` — credential created first with API Key)
5. **`byo-phone-number`** — BYO SIP Trunk (needs `credentialId` — credential created with gateway IP + optional auth)

### Two-Step Flow for Vonage/Telnyx/BYO SIP:
1. **Create a credential** via `POST /credential` — returns a `credentialId`
2. **Create a phone number** via `POST /phone-number` — uses that `credentialId`

### One-Step Flow for Twilio:
Twilio phone numbers are created directly via `POST /phone-number` with `provider: "twilio"` — Vapi handles the credential internally:
```json
{
  "provider": "twilio",
  "number": "+1234567890",
  "twilioAccountSid": "AC...",
  "twilioAuthToken": "..."
}
```

## What Needs to Change

### 1. Vapi Service (`packages/backend/src/services/vapi.ts`)

**ADD** credential CRUD functions:
```typescript
// CREATE credential
export async function createCredential(params: {
  provider: 'twilio' | 'vonage' | 'telnyx' | 'byo-sip-trunk';
  // Twilio
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
  // Vonage
  vonageApiKey?: string;
  vonageApiSecret?: string;
  // Telnyx
  telnyxApiKey?: string;
  // BYO SIP
  gateways?: Array<{ ip: string; port?: number; netmask?: number; inboundEnabled?: boolean; outboundEnabled?: boolean }>;
  name?: string;
  outboundAuthenticationPlan?: { authUsername: string; authPassword?: string };
  sipTrunkingProvider?: string;
}) {
  const body: Record<string, unknown> = { provider: params.provider };
  
  if (params.provider === 'twilio') {
    body.accountSid = params.accountSid;
    body.authToken = params.authToken;
    body.apiKey = params.apiKey;
    body.apiSecret = params.apiSecret;
  } else if (params.provider === 'vonage') {
    body.apiKey = params.vonageApiKey;
    body.apiSecret = params.vonageApiSecret;
  } else if (params.provider === 'telnyx') {
    body.apiKey = params.telnyxApiKey;
  } else if (params.provider === 'byo-sip-trunk') {
    body.gateways = params.gateways;
    if (params.name) body.name = params.name;
    if (params.outboundAuthenticationPlan) body.outboundAuthenticationPlan = params.outboundAuthenticationPlan;
    if (params.sipTrunkingProvider) body.sipTrunkingProvider = params.sipTrunkingProvider;
  }
  
  return vapiRequest('POST', '/credential', body);
}

export async function listCredentials() {
  return vapiRequest('GET', '/credential');
}

export async function deleteCredential(credentialId: string) {
  return vapiRequest('DELETE', `/credential/${credentialId}`);
}
```

**UPDATE** `createPhoneNumber` to support all providers:
```typescript
export interface CreatePhoneNumberParams {
  provider: 'vapi' | 'twilio' | 'vonage' | 'telnyx' | 'byo-phone-number';
  name?: string;
  number?: string; // Required for twilio, vonage, telnyx, byo
  assistantId?: string;
  serverUrl?: string;
  fallbackNumber?: string;
  // Twilio-specific (inline credentials)
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  // For vonage, telnyx, byo — uses credentialId
  credentialId?: string;
  // BYO SIP specific
  numberE164CheckEnabled?: boolean;
  sipUri?: string; // alternative to number for SIP
}
```

### 2. Prisma Schema — ADD Credential model

```prisma
model Credential {
  id                String   @id @default(uuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  provider          String   // twilio, vonage, telnyx, byo-sip-trunk
  vapiCredentialId  String?  @unique
  name              String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([organizationId])
}
```

Also update PhoneNumber model — `number` should NOT be `@unique` globally (multiple orgs could have different references). Change to `@@unique([organizationId, number])`.

### 3. Backend Routes — NEW `packages/backend/src/routes/credentials.ts`

```
POST /api/credentials — Create a credential (stores in Vapi + local DB)
GET /api/credentials — List org's credentials
DELETE /api/credentials/:id — Delete credential (from Vapi + local DB)
```

### 4. Backend Routes — UPDATE `packages/backend/src/routes/phoneNumbers.ts`

**CRITICAL CHANGE**: The `GET /api/phone-numbers/vapi` endpoint currently lists ALL Vapi account numbers. This MUST be removed or restricted. Clients should ONLY see numbers they created through VoxReach.

**Updated endpoints:**
- `GET /api/phone-numbers` — Only returns numbers belonging to the client's organization (already correct)
- `POST /api/phone-numbers` — Updated to support all providers:
  - `provider: "vapi"` → Provision free Vapi number
  - `provider: "twilio"` → Import Twilio number (pass accountSid, authToken, number)
  - `provider: "vonage"` → Import Vonage number (pass credentialId, number)
  - `provider: "telnyx"` → Import Telnyx number (pass credentialId, number)
  - `provider: "byo-phone-number"` → Import BYO SIP (pass credentialId, number/sipUri)
- `DELETE /api/phone-numbers/vapi` route — **REMOVE** (exposes internal Vapi numbers)

### 5. Frontend — REWRITE `packages/frontend/src/pages/PhoneNumbers.tsx`

**Remove:**
- "Import from Vapi" modal (exposes internal numbers)
- Any reference to browsing Vapi's phone numbers directly

**New UI Flow:**

#### Main Page
- List of client's phone numbers with status, provider badge, assigned agent
- "Add Phone Number" button

#### "Add Phone Number" Modal — Step 1: Choose Provider
Four cards:
1. **Twilio** — "Import a number from your Twilio account"
2. **Vonage** — "Import a number from your Vonage account"
3. **Telnyx** — "Import a number from your Telnyx account"
4. **BYO SIP Trunk** — "Bring your own SIP trunk number"
5. *(Optional)* **Vapi Number** — "Get a free test number (US only)" — only show for dev/testing

#### Step 2: Credential Entry (varies by provider)

**Twilio:**
- Account SID (text, starts with "AC")
- Auth Token (password field)
- API Key (text)
- API Secret (password field)
- Phone Number (tel, E.164 format like +1234567890)

**Vonage:**
- API Key (text)
- API Secret (password field)
- Phone Number (tel, E.164)
- → Backend first creates credential via Vapi, then imports number

**Telnyx:**
- API Key (password field)
- Phone Number (tel, E.164)
- → Backend first creates credential via Vapi, then imports number

**BYO SIP Trunk:**
- Gateway IP Address (text, validated as IP/domain)
- Gateway Port (number, optional, default 5060)
- Auth Username (text, optional)
- Auth Password (password, optional)
- Phone Number OR SIP URI (text)
- → Backend first creates credential, then imports number

#### Step 3: Assign to Agent (optional)
- Dropdown of existing agents
- "Assign later" option

### 6. Register Routes
In `packages/backend/src/index.ts`, add:
```typescript
import credentialRoutes from './routes/credentials';
app.use('/api/credentials', credentialRoutes);
```

## Vapi API Reference (Tested & Verified)

### Create Credential
```
POST https://api.vapi.ai/credential
Authorization: Bearer <server-key>
Content-Type: application/json

# Twilio
{"provider":"twilio","accountSid":"AC...","authToken":"...","apiKey":"...","apiSecret":"..."}

# Vonage  
{"provider":"vonage","apiKey":"...","apiSecret":"..."}

# Telnyx
{"provider":"telnyx","apiKey":"..."}

# BYO SIP Trunk
{"provider":"byo-sip-trunk","gateways":[{"ip":"192.168.1.1"}],"name":"My SIP","outboundAuthenticationPlan":{"authUsername":"user"}}
```

### Create Phone Number
```
POST https://api.vapi.ai/phone-number
Authorization: Bearer <server-key>
Content-Type: application/json

# Vapi free number
{"provider":"vapi","name":"My Number"}

# Twilio (inline credentials)
{"provider":"twilio","number":"+1234567890","twilioAccountSid":"AC...","twilioAuthToken":"..."}

# Vonage (needs credentialId from step 1)
{"provider":"vonage","number":"+1234567890","credentialId":"<uuid>"}

# Telnyx (needs credentialId from step 1)
{"provider":"telnyx","number":"+1234567890","credentialId":"<uuid>"}

# BYO SIP (needs credentialId from step 1)
{"provider":"byo-phone-number","number":"+1234567890","credentialId":"<uuid>","numberE164CheckEnabled":true}
```

### List/Get/Update/Delete Phone Numbers
```
GET /phone-number — list all
GET /phone-number/:id — get one
PATCH /phone-number/:id — update (assistantId, name, server, etc.)
DELETE /phone-number/:id — delete
```

### List/Delete Credentials
```
GET /credential — list all
DELETE /credential/:id — delete
```

## Implementation Order
1. Prisma schema migration (add Credential model, fix PhoneNumber unique constraint)
2. Vapi service functions (credential CRUD + updated phone number creation)
3. Backend credential routes
4. Backend phone number routes (update existing)
5. Frontend PhoneNumbers.tsx (complete rewrite)
6. Register new routes in index.ts
7. Test each provider flow end-to-end
8. Git commit and push → Railway auto-deploys

## Key Config Values
- Backend webhook URL: `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`
- Vapi server key: `ae8a926a-d8e2-4166-bdc1-8dd2cb87c6a7`
- These are set in the backend config and should NOT be exposed to the client frontend

## Security Notes
- Credentials (Twilio auth tokens, Vonage API secrets, etc.) are sent to Vapi and stored there — we do NOT store them locally
- We only store the `vapiCredentialId` reference in our DB
- The `/api/phone-numbers/vapi` endpoint MUST be removed — it leaks internal infrastructure
- All credential/phone-number endpoints require authentication via `authenticate` middleware
