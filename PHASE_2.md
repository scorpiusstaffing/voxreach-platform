# VoxReach Phase 2 — Complete Feature Buildout
## All Tier 1 & Tier 2 Features (Through Professional Plan)

**Document Version:** 1.0  
**Date:** February 15, 2026  
**Target:** Professional Plan ($149/mo) Features

---

## TIER 1: FOUNDATION (Core Infrastructure)

### 1.1 Voice Infrastructure (Vapi Integration)
**Status:** ✅ COMPLETE

**Features:**
- Multi-provider voice support (ElevenLabs, Deepgram, OpenAI, Azure, etc.)
- 23+ pre-configured voices
- Inbound & outbound calling
- Call recording & transcription
- Real-time webhook processing
- Voice speed/pitch customization

**Tech Stack:**
- Vapi API integration
- Webhook endpoint (`/api/webhooks/vapi`)
- Prisma models: `Call`, `Agent`, `PhoneNumber`

---

### 1.2 Agent Management System
**Status:** ✅ COMPLETE

**Features:**
- Create/edit/delete AI agents
- System prompt configuration
- First message customization
- Voice provider selection
- Language settings
- Transfer number configuration
- Agent activation/deactivation

**Tech Stack:**
- React frontend: `Agents.tsx`
- Backend routes: `/api/agents`
- Vapi assistant sync

---

### 1.3 Phone Number Management
**Status:** ✅ COMPLETE

**Features:**
- Provision Vapi numbers (US)
- Import external numbers:
  - Twilio (inline credentials)
  - Vonage (credential-based)
  - Telnyx (credential-based)
  - BYO SIP Trunk (gateway config)
- Assign numbers to agents
- Number status monitoring

**Tech Stack:**
- Credential management system
- Vapi phone number API
- Prisma model: `PhoneNumber`, `Credential`

---

### 1.4 Call History & Logs
**Status:** ✅ COMPLETE

**Features:**
- Call list with filtering
- Call detail view (transcript, recording)
- Status tracking (completed, failed, in-progress)
- Duration tracking
- Agent assignment history

**Tech Stack:**
- Frontend: `Calls.tsx`
- Backend: `/api/calls`
- Prisma model: `Call`

---

### 1.5 Basic Analytics
**Status:** ✅ COMPLETE

**Features:**
- Total calls counter
- Total minutes used
- Active agents count
- Phone numbers count
- Recent calls list

**Tech Stack:**
- Dashboard stats endpoint
- Basic aggregation queries

---

### 1.6 User Authentication & Organization Management
**Status:** ✅ COMPLETE

**Features:**
- User registration/login
- JWT token authentication
- Organization isolation
- Multi-user support (single org)
- Password reset flow

**Tech Stack:**
- JWT implementation
- bcrypt password hashing
- Prisma models: `User`, `Organization`

---

## TIER 2: PROFESSIONAL ($149/mo)

### 2.1 Script A/B Testing Engine
**Status:** 🔄 PLANNED

**Description:**  
Test different agent prompts against each other to find what converts best.

**Features:**
- Create multiple script variants per agent
- Automatic 50/50 traffic splitting
- Conversion tracking per variant
- Statistical significance calculator
- Auto-promote winning variant
- Variant performance dashboard

**User Flow:**
1. User creates Agent
2. Clicks "Create A/B Test"
3. Writes Variant A (control) and Variant B (test)
4. Sets success criteria (call outcome = "qualified")
5. System auto-rotates calls between variants
6. After 100 calls, declares winner
7. Option to auto-switch all traffic to winner

**Database Schema:**
```prisma
model ScriptVariant {
  id              String   @id @default(uuid())
  agentId         String
  name            String   // "Soft Close", "Aggressive Open"
  prompt          String   // The system prompt
  isControl       Boolean  // true = A, false = B
  trafficPercent  Int      // 50 for 50/50
  
  // Metrics
  callCount       Int      @default(0)
  qualifiedCount  Int      @default(0)
  appointmentCount Int     @default(0)
  conversionRate  Float?
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  agent           Agent    @relation(fields: [agentId], references: [id])
}

model ABTest {
  id              String   @id @default(uuid())
  agentId         String
  name            String
  status          String   // running, completed, paused
  winnerId        String?  // ScriptVariant ID
  
  // Criteria
  successOutcome  String   // "qualified", "appointment", "sale"
  minSampleSize   Int      @default(100)
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  
  agent           Agent    @relation(fields: [agentId], references: [id])
  variants        ScriptVariant[]
}
```

**API Endpoints:**
```
POST   /api/agents/:id/variants          // Create variant
GET    /api/agents/:id/variants          // List variants
PATCH  /api/variants/:id                 // Update variant
DELETE /api/variants/:id                 // Delete variant
POST   /api/agents/:id/ab-tests          // Start A/B test
GET    /api/ab-tests/:id                 // Get test results
POST   /api/ab-tests/:id/declare-winner  // Manual winner selection
```

**Frontend Pages:**
- `ABTestCreate.tsx` — Create new test wizard
- `ABTestResults.tsx` — Results dashboard with charts
- `VariantEditor.tsx` — Edit script variants
- Agent detail page → "A/B Testing" tab

**Complexity:** HIGH  
**Estimated Time:** 4-5 days

---

### 2.2 Smart Calendar Integration
**Status:** 🔄 PLANNED

**Description:**  
Allow AI agents to check availability and book meetings directly into calendars.

**Supported Calendars (Phase 1):**
- Google Calendar (OAuth 2.0)
- Microsoft Outlook/Office 365
- Calendly (webhook-based)

**Features:**
- OAuth connection flow per user
- Real-time availability checking
- Create calendar events with details
- Add video conference links (Zoom, Google Meet)
- Send calendar invites to attendees
- Buffer time configuration
- Working hours enforcement

**User Flow:**
1. User goes to Settings → Integrations
2. Clicks "Connect Google Calendar"
3. OAuth flow completes
4. In agent prompt: "I can book meetings. Ask what time works."
5. Agent asks: "I have Tuesday 2pm or Wednesday 10am. Which works?"
6. Agent checks calendar → Books slot → Confirms

**Database Schema:**
```prisma
model CalendarIntegration {
  id            String   @id @default(uuid())
  userId        String
  organizationId String
  
  provider      String   // google, outlook, calendly
  accessToken   String   // Encrypted
  refreshToken  String   // Encrypted
  expiresAt     DateTime
  
  // Calendar settings
  calendarId    String?  // Which calendar to use
  bufferMinutes Int      @default(15)
  workingHoursStart String @default("09:00")
  workingHoursEnd   String @default("17:00")
  timezone      String   @default("America/New_York")
  
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

**Tool for Agents:**
```typescript
{
  type: 'function',
  name: 'check_availability',
  description: 'Check if a time slot is available in the calendar',
  parameters: {
    date: '2026-02-20', // YYYY-MM-DD
    time: '14:00',      // HH:MM
    duration: 30        // minutes
  }
}

{
  type: 'function',
  name: 'book_appointment',
  description: 'Book a meeting in the calendar',
  parameters: {
    date: '2026-02-20',
    time: '14:00',
    duration: 30,
    title: 'Demo Call with Prospect',
    attendeeName: 'John Doe',
    attendeeEmail: 'john@example.com',
    attendeePhone: '+1234567890',
    addVideoLink: true // Auto-create Zoom/Meet
  }
}
```

**API Endpoints:**
```
POST /api/integrations/calendars/connect     // Start OAuth
GET  /api/integrations/calendars/callback    // OAuth callback
GET  /api/integrations/calendars             // List connected calendars
DELETE /api/integrations/calendars/:id       // Disconnect

POST /api/calendar/check-availability        // Check slot
POST /api/calendar/book                      // Book appointment
```

**Frontend:**
- Settings page → Integrations tab
- Calendar connection cards (Google, Outlook, Calendly)
- Availability configuration modal

**Complexity:** HIGH  
**Estimated Time:** 5-6 days

---

### 2.3 Outbound Campaign Manager
**Status:** 🔄 PLANNED

**Description:**  
Bulk outbound calling with scheduling, retries, and intelligent routing.

**Features:**
- CSV upload with custom fields (name, phone, company, notes)
- Campaign scheduling (start time, end time, timezone)
- Smart retry logic:
  - Busy signal: Retry in 30 min
  - No answer: Retry in 2 hours
  - Voicemail: Mark as left message
  - Max 3 retries per number
- Local presence (dynamic caller ID by area code)
- Do Not Call (DNC) list scrubbing
- Campaign pause/resume
- Real-time progress tracking
- Campaign analytics (contact rate, conversion rate)

**Database Schema:**
```prisma
model Campaign {
  id              String   @id @default(uuid())
  organizationId  String
  agentId         String
  
  name            String
  description     String?
  status          String   // draft, scheduled, running, paused, completed
  
  // Scheduling
  scheduledStart  DateTime?
  scheduledEnd    DateTime?
  timezone        String   @default("America/New_York")
  
  // Call settings
  maxRetries      Int      @default(3)
  retryInterval   Int      @default(120) // minutes
  callerIdStrategy String   @default("fixed") // fixed, local_presence, rotating
  
  // Stats
  totalContacts   Int      @default(0)
  callsMade       Int      @default(0)
  callsConnected  Int      @default(0)
  callsSuccessful Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  agent           Agent    @relation(fields: [agentId], references: [id])
  contacts        CampaignContact[]
  calls           CampaignCall[]
}

model CampaignContact {
  id          String   @id @default(uuid())
  campaignId  String
  
  // Contact info
  firstName   String?
  lastName    String?
  phone       String
  email       String?
  company     String?
  customData  Json?    // Flexible custom fields
  
  // Status
  status      String   @default("pending") // pending, calling, completed, failed, dnc
  priority    Int      @default(0) // For ordering
  
  // Retry tracking
  attemptCount Int     @default(0)
  lastAttemptAt DateTime?
  nextAttemptAt DateTime?
  
  // Result
  outcome     String?  // qualified, not_interested, voicemail, callback_requested
  notes       String?
  
  campaign    Campaign @relation(fields: [campaignId], references: [id])
}

model CampaignCall {
  id              String   @id @default(uuid())
  campaignId      String
  campaignContactId String
  callId          String   // Reference to Call model
  
  attemptNumber   Int
  result          String   // connected, busy, no_answer, voicemail, failed
  
  campaign        Campaign @relation(fields: [campaignId], references: [id])
  campaignContact CampaignContact @relation(fields: [campaignContactId], references: [id])
}

model DNCList {
  id              String   @id @default(uuid())
  organizationId  String
  phone           String
  reason          String?  // opt_out, manual_add, bounced
  source          String   // user_added, auto_detected
  addedAt         DateTime @default(now())
}
```

**Campaign Runner (Background Job):**
```typescript
// Cron job or worker process
// Runs every minute to check for scheduled campaigns

async function processCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'running',
      scheduledStart: { lte: new Date() },
    },
    include: { contacts: { where: { status: 'pending' } } }
  });
  
  for (const campaign of campaigns) {
    // Get contacts ready to call
    const readyContacts = campaign.contacts.filter(c => 
      c.nextAttemptAt === null || c.nextAttemptAt <= new Date()
    );
    
    // Batch call initiation (respect rate limits)
    for (const contact of readyContacts.slice(0, 10)) {
      await initiateCall(campaign, contact);
    }
  }
}
```

**API Endpoints:**
```
POST   /api/campaigns                          // Create campaign
GET    /api/campaigns                          // List campaigns
GET    /api/campaigns/:id                      // Get campaign details
PATCH  /api/campaigns/:id                      // Update campaign
DELETE /api/campaigns/:id                      // Delete campaign

POST   /api/campaigns/:id/upload              // Upload CSV contacts
GET    /api/campaigns/:id/contacts            // List contacts
GET    /api/campaigns/:id/stats               // Campaign statistics

POST   /api/campaigns/:id/start               // Start campaign
POST   /api/campaigns/:id/pause               // Pause campaign
POST   /api/campaigns/:id/resume              // Resume campaign

POST   /api/dnc                               // Add to DNC list
GET    /api/dnc                               // Check DNC status
```

**Frontend:**
- `Campaigns.tsx` — Campaign list
- `CampaignCreate.tsx` — Create/edit wizard
- `CampaignUpload.tsx` — CSV upload with field mapping
- `CampaignDetail.tsx` — Progress tracking, stats, pause/resume
- `CampaignContacts.tsx` — View/edit contact list

**CSV Upload Flow:**
1. User uploads CSV
2. System detects columns (name, phone, etc.)
3. User maps columns if needed
4. Preview first 5 rows
5. Import and deduplicate
6. Scrub against DNC list

**Complexity:** VERY HIGH  
**Estimated Time:** 7-10 days

---

### 2.4 HubSpot Integration
**Status:** 🔄 PLANNED

**Description:**  
Seamless two-way sync with HubSpot CRM.

**Features:**
- OAuth connection to HubSpot
- Sync calls as activities
- Create/update contacts from calls
- Update deal stages based on call outcomes
- Log transcripts as notes
- Attach call recordings to contacts
- Sync custom fields
- Real-time webhook sync

**Sync Logic:**
```
Inbound Call:
  → Search HubSpot by phone
  → If found: Log call to existing contact
  → If not found: Create new contact
  → Attach transcript + recording

Outbound Call:
  → Pre-load contact data from HubSpot
  → Agent has context before call starts
  → Log outcome back to HubSpot

Call Outcome Mapping:
  "Qualified" → Create Deal (or update Deal stage)
  "Appointment Booked" → Create Meeting + Update Deal
  "Not Interested" → Update Contact property
```

**Database Schema:**
```prisma
model CRMIntegration {
  id              String   @id @default(uuid())
  organizationId  String
  
  provider        String   // hubspot, salesforce, pipedrive
  accessToken     String   // Encrypted
  refreshToken    String   // Encrypted
  expiresAt       DateTime
  
  // Config
  syncEnabled     Boolean  @default(true)
  autoCreateContacts Boolean @default(true)
  defaultDealStage String?  // HubSpot deal stage ID
  
  // Field mappings (JSON)
  fieldMappings   Json?    // { "phone": "phone", "company": "company" }
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

**HubSpot API Actions:**
```typescript
// Actions performed via HubSpot API
- searchContactByPhone(phone: string)
- createContact(data: ContactData)
- updateContact(contactId: string, data: ContactData)
- createEngagement(contactId: string, callData: CallData)
- createDeal(contactId: string, dealData: DealData)
- updateDealStage(dealId: string, stage: string)
```

**API Endpoints:**
```
POST /api/integrations/crm/connect          // OAuth start
GET  /api/integrations/crm/callback         // OAuth callback
GET  /api/integrations/crm                  // Get integration status
PATCH /api/integrations/crm                 // Update settings
DELETE /api/integrations/crm                // Disconnect

POST /api/integrations/crm/sync-contact     // Manual sync test
```

**Frontend:**
- Settings → Integrations → HubSpot card
- Connection status indicator
- Field mapping configuration
- Sync history log

**Complexity:** MEDIUM  
**Estimated Time:** 3-4 days

---

### 2.5 Salesforce Integration
**Status:** 🔄 PLANNED

**Description:**  
Enterprise-grade CRM integration for Salesforce users.

**Features:**
- OAuth 2.0 connection
- Lead/Contact/Account sync
- Opportunity stage updates
- Task creation for calls
- Custom object support
- Bulk API for large data sets

**Implementation Notes:**
- Similar architecture to HubSpot
- Salesforce has more complex object model
- Handle API limits (bulk operations)

**Complexity:** MEDIUM  
**Estimated Time:** 3-4 days  
**Dependencies:** HubSpot integration (reuse patterns)

---

### 2.6 Pipedrive Integration
**Status:** 🔄 PLANNED

**Description:**  
Integration with Pipedrive sales CRM.

**Features:**
- OAuth connection
- Person/Organization sync
- Deal stage progression
- Activity logging
- Note attachment

**Complexity:** LOW  
**Estimated Time:** 2 days  
**Dependencies:** HubSpot integration

---

### 2.7 Advanced Analytics Dashboard
**Status:** 🔄 PLANNED

**Description:**  
Deep insights into call performance and conversion metrics.

**Features:**
- Conversion funnel visualization
  - Calls → Contacts → Qualified → Appointments → Sales
- Talk ratio analysis (agent vs prospect speaking time)
- Sentiment analysis trends
- Best time to call heatmap (by hour/day)
- Script adherence scoring
- Agent performance comparison
- Export to PDF/Excel

**Metrics to Track:**
```typescript
interface AnalyticsMetrics {
  // Call volume
  totalCalls: number;
  callsByDay: { date: string; count: number }[];
  callsByHour: { hour: number; count: number }[];
  
  // Conversion
  conversionRate: number; // % of calls that hit target outcome
  funnelStages: {
    stage: string;
    count: number;
    conversionRate: number; // from previous stage
  }[];
  
  // Talk analysis
  avgTalkTime: number; // seconds
  avgListenTime: number; // seconds
  talkRatio: number; // agent:talk / prospect:talk
  
  // Outcomes
  outcomes: { outcome: string; count: number; percentage: number }[];
  
  // Agent performance
  agentStats: {
    agentId: string;
    agentName: string;
    calls: number;
    conversionRate: number;
    avgCallDuration: number;
  }[];
  
  // Time-based
  bestTimeToCall: { hour: number; conversionRate: number };
  bestDayToCall: { day: string; conversionRate: number };
}
```

**Database:**
- Use existing Call model
- Add aggregation queries
- Cache daily stats for performance

**Frontend:**
- Recharts for visualizations
- Date range picker
- Export buttons
- Agent filter

**API Endpoints:**
```
GET /api/analytics/overview?startDate=&endDate=
GET /api/analytics/conversion-funnel?startDate=&endDate=
GET /api/analytics/talk-time?startDate=&endDate=
GET /api/analytics/best-times?startDate=&endDate=
GET /api/analytics/agents?startDate=&endDate=
GET /api/analytics/export?format=pdf|excel
```

**Complexity:** MEDIUM  
**Estimated Time:** 4-5 days

---

### 2.8 Slack Notifications
**Status:** 🔄 PLANNED

**Description:**  
Real-time alerts in Slack for important call events.

**Notification Types:**
- 🎯 Hot lead qualified
- 📅 Appointment booked
- ⚠️ High-value call in progress
- 📊 Daily summary report
- 🚨 Call failed (technical issue)

**Features:**
- Connect multiple Slack workspaces
- Channel selection per notification type
- @mention specific users
- Custom message templates
- Mute hours (don't notify at night)

**Database Schema:**
```prisma
model SlackIntegration {
  id              String   @id @default(uuid())
  organizationId  String
  
  workspaceName   String
  webhookUrl      String   // Encrypted
  channel         String   // #sales, #general
  
  // Notification preferences
  notifyOnHotLead     Boolean @default(true)
  notifyOnAppointment Boolean @default(true)
  notifyOnFailure     Boolean @default(true)
  dailySummary        Boolean @default(true)
  summaryTime         String  @default("09:00") // 9am
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

**Slack Message Examples:**
```javascript
// Hot lead notification
{
  text: "🎯 Hot Lead Alert!",
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*John Doe* from *Acme Corp* just qualified on a call with *Sales Agent 1*"
      }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Phone:*\n+1 (555) 123-4567" },
        { type: "mrkdwn", text: "*Interest:*\nEnterprise Plan" },
        { type: "mrkdwn", text: "*Call Duration:*\n4:32" },
        { type: "mrkdwn", text: "*Sentiment:*\nVery Positive 😊" }
      ]
    },
    {
      type: "actions",
      elements: [
        { type: "button", text: "View Transcript", url: "https://..." },
        { type: "button", text: "Call Back", url: "tel:+15551234567" }
      ]
    }
  ]
}
```

**API Endpoints:**
```
POST /api/integrations/slack           // Create connection
DELETE /api/integrations/slack/:id     // Disconnect
PATCH /api/integrations/slack/:id      // Update preferences
POST /api/integrations/slack/test      // Send test message
```

**Complexity:** LOW  
**Estimated Time:** 2-3 days

---

## IMPLEMENTATION ROADMAP

### Sprint 1 (Week 1): Foundation + Quick Wins
| Feature | Days | Priority |
|---------|------|----------|
| Slack Notifications | 2 | P1 |
| Pipedrive Integration | 2 | P2 |
| HubSpot Integration | 3 | P1 |

### Sprint 2 (Week 2): Core Differentiators
| Feature | Days | Priority |
|---------|------|----------|
| Advanced Analytics | 4 | P1 |
| Salesforce Integration | 3 | P2 |

### Sprint 3 (Week 3-4): Heavy Lifting
| Feature | Days | Priority |
|---------|------|----------|
| Calendar Integration | 5 | P1 |
| Script A/B Testing | 5 | P1 |

### Sprint 4 (Week 5-6): Scale
| Feature | Days | Priority |
|---------|------|----------|
| Campaign Manager | 8 | P1 |
| Final Testing & Polish | 2 | - |

**Total Timeline: 6 weeks (1 developer)**  
**With 2 developers: 3-4 weeks**

---

## PRICING POSITIONING

### Professional Plan ($149/mo) Includes:
✅ Agents: 5  
✅ Minutes: 2,000  
✅ Script A/B Testing  
✅ Calendar Integration  
✅ HubSpot OR Pipedrive  
✅ Advanced Analytics  
✅ Slack Notifications  

### Add-ons:
- Salesforce Integration: +$49/mo
- Campaign Manager: +$99/mo
- Additional CRM: +$29/mo each

---

## TECHNICAL NOTES

### Required Infrastructure:
1. **Background Job Runner** (for campaigns, retries)
   - Option: Railway cron jobs
   - Option: Separate worker service
   - Option: Queue system (Bull/Redis)

2. **OAuth Management** (for integrations)
   - Secure token storage (encrypted)
   - Token refresh logic
   - Connection health monitoring

3. **External API Rate Limiting**
   - HubSpot: 100 requests/10 seconds
   - Salesforce: Varies by plan
   - Calendar APIs: Generally generous

### Security Considerations:
- All tokens encrypted at rest
- OAuth state validation
- Webhook signature verification
- Scope minimal permissions

### Performance:
- Cache integration status
- Batch API calls where possible
- Async processing for webhooks
- Database indexing on phone numbers

---

## NEXT STEPS

1. **Review & Approve** this specification
2. **Prioritize** which feature to build first
3. **Set up infrastructure** (job runner, etc.)
4. **Begin Sprint 1** implementation

**Recommended First Feature:** Slack Notifications (quick win, builds foundation)

---

*Document maintained by: VoxReach Development Team*  
*Last Updated: February 15, 2026*
