# Voxreach — Architecture & Developer Guide

> **Read this before touching any code.** This is the source of truth for how the app is built.

## Project Structure

```
voxreach/
├── package.json              ← Workspace root (npm workspaces)
├── packages/
│   ├── shared/               ← Shared TypeScript types & enums (not currently wired into backend/frontend — standalone reference)
│   ├── backend/              ← Express API server
│   │   ├── prisma/
│   │   │   └── schema.prisma ← DATABASE SCHEMA — single source of truth for all models
│   │   ├── src/
│   │   │   ├── index.ts      ← Express app entrypoint
│   │   │   ├── config.ts     ← All env var loading + validation
│   │   │   ├── db.ts         ← Prisma client singleton
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts   ← JWT authentication + role middleware
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts         ← POST /signup, /login, GET /me
│   │   │   │   ├── agents.ts       ← CRUD agents (syncs to Vapi assistants)
│   │   │   │   ├── phoneNumbers.ts ← Provision/manage phone numbers via Vapi
│   │   │   │   ├── calls.ts        ← Call history + outbound call initiation
│   │   │   │   ├── campaigns.ts    ← Campaign CRUD, CSV upload, batch calling
│   │   │   │   ├── webhooks.ts     ← Vapi webhook receiver (call events)
│   │   │   │   └── dashboard.ts    ← Aggregated stats for dashboard
│   │   │   └── services/
│   │   │       ├── vapi.ts    ← All Vapi API calls (REST, no SDK)
│   │   │       └── stripe.ts ← Stripe customer/subscription management
│   │   └── Dockerfile
│   └── frontend/             ← React SPA
│       ├── src/
│       │   ├── main.tsx      ← App entrypoint (React Query, Router, Auth provider)
│       │   ├── App.tsx       ← Route definitions
│       │   ├── lib/
│       │   │   ├── api.ts    ← Fetch wrapper (auto-attaches JWT from localStorage)
│       │   │   └── auth.tsx  ← Auth context provider (login/signup/logout/me)
│       │   └── pages/
│       │       ├── Landing.tsx      ← Homepage with intent selection
│       │       ├── Login.tsx        ← Login form
│       │       ├── Signup.tsx       ← Signup with intent (inbound/outbound)
│       │       ├── Dashboard.tsx    ← Main dashboard with sidebar + stats
│       │       ├── Agents.tsx       ← Agent list + create modal
│       │       ├── PhoneNumbers.tsx ← Phone number list + provision modal
│       │       └── Calls.tsx        ← Call history with expandable transcripts
│       ├── index.html
│       ├── tailwind.config.js
│       └── Dockerfile
```

## Critical Patterns

### 1. Auth Flow
- JWT stored in `localStorage` as `voxreach_token`
- Every API call attaches `Authorization: Bearer <token>` via `lib/api.ts`
- Backend decodes JWT in `middleware/auth.ts`, attaches `userId`, `organizationId`, `userRole` to request
- **All data is scoped to `organizationId`** — every query filters by it. Never skip this.

### 2. Vapi Integration (backend/src/services/vapi.ts)
- **Direct REST calls to `https://api.vapi.ai`** — no Vapi SDK
- Auth: `Bearer <VAPI_SERVER_KEY>` header
- Key entities synced:
  - **Agent → Vapi Assistant**: Created on agent create, updated on agent update, deleted on agent delete
  - **Phone Number → Vapi Phone Number**: Provisioned via `POST /phone-number` with `provider: "vapi"`
  - **Call → Vapi Call**: Outbound calls initiated via `POST /call`
- `vapiAssistantId`, `vapiPhoneNumberId`, `vapiCallId` are stored in our DB as foreign references
- **If Vapi calls fail, the route returns 502** — don't swallow these errors silently

### 3. Webhook Processing (backend/src/routes/webhooks.ts)
- Endpoint: `POST /api/webhooks/vapi`
- **Always returns 200** even on errors (prevents Vapi retry storms)
- Matches incoming events by `message.call.id` → our DB's `vapiCallId`
- Handles: `status-update`, `end-of-call-report`, `hang`
- Updates call status, duration, transcript, recording URL, cost
- Also updates campaign stats and lead status when applicable

### 4. Database (Prisma + PostgreSQL)
- **schema.prisma is the single source of truth** — don't create tables manually
- Migrations: `npx prisma migrate deploy` runs on container start (Dockerfile CMD)
- Key relationships:
  - User → Organization (many-to-one)
  - Agent → Organization (many-to-one)
  - PhoneNumber → Organization + optional Agent
  - Call → Organization + optional Agent + optional PhoneNumber + optional Campaign + optional Lead
  - Campaign → Organization + Agent
  - Lead → Campaign + Organization
- **All string enums** (not Prisma enums) — e.g., `status: "completed"`, `direction: "inbound"`

### 5. Frontend State
- **Auth state**: React Context (`lib/auth.tsx`) — holds user + organization + token
- **API calls**: Plain fetch via `lib/api.ts` — no Redux, no complex state management
- **React Query** is imported but currently used minimally — feel free to wire it up for caching
- **Organization intent** (`inbound` | `outbound`) drives dashboard UX — check `organization.intent`

### 6. Styling
- **Tailwind CSS** — no component library
- Brand color: `brand-500` through `brand-900` (blue-indigo palette, defined in `tailwind.config.js`)
- Font: Inter (loaded from Google Fonts in `index.html`)
- Design principle: minimal, premium, lots of whitespace. No clutter.

## Environment Variables

### Backend
| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `JWT_SECRET` | JWT signing key | any random string |
| `VAPI_SERVER_KEY` | Vapi server-side API key | UUID |
| `VAPI_PUBLIC_KEY` | Vapi public-side key (for frontend widget later) | UUID |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_...` |
| `FRONTEND_URL` | CORS origin | `https://frontend-production-896c.up.railway.app` |
| `WEBHOOK_URL` | Full Vapi webhook URL | `https://backend-production-fc92.up.railway.app/api/webhooks/vapi` |

### Frontend
| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `https://backend-production-fc92.up.railway.app/api` |

## Railway Deployment

- **Project:** Voxreach (`26928579-ba21-42e3-a2a8-be1616dc27ab`)
- **Environment:** production (`c3b7d3ea-7c9a-44d6-ad1d-947d3c989f5c`)
- **Services:**
  - Postgres (`cbd85ae1`) — `ghcr.io/railway-images/postgres:17`
  - Backend (`6b3c4f99`) — builds from `packages/backend/`, has Dockerfile
  - Frontend (`7ae93c32`) — builds from `packages/frontend/`, has Dockerfile
- **Domains:**
  - Backend: `backend-production-fc92.up.railway.app`
  - Frontend: `frontend-production-896c.up.railway.app`
- Both services deploy automatically on push to `main`
- Backend Dockerfile runs `prisma migrate deploy` before starting the server

## API Routes Reference

All routes prefixed with `/api`. Auth routes are public; all others require `Authorization: Bearer <token>`.

```
POST   /api/auth/signup          — Create account (body: email, password, name, organizationName, intent)
POST   /api/auth/login           — Login (body: email, password)
GET    /api/auth/me              — Get current user + org

GET    /api/agents               — List org agents
POST   /api/agents               — Create agent (creates Vapi assistant)
GET    /api/agents/:id           — Get agent + recent calls
PATCH  /api/agents/:id           — Update agent (updates Vapi assistant)
DELETE /api/agents/:id           — Delete agent (deletes Vapi assistant)

GET    /api/phone-numbers        — List org phone numbers
POST   /api/phone-numbers        — Provision new number via Vapi
PATCH  /api/phone-numbers/:id    — Update (assign agent, rename)
DELETE /api/phone-numbers/:id    — Release number

GET    /api/calls                — List calls (query: agentId, status, direction, page, limit)
POST   /api/calls/outbound       — Make single outbound call
GET    /api/calls/:id            — Get call details

GET    /api/campaigns            — List campaigns
POST   /api/campaigns            — Create campaign
GET    /api/campaigns/:id        — Get campaign + leads
POST   /api/campaigns/:id/leads  — Upload CSV leads (multipart/form-data, field: file)
POST   /api/campaigns/:id/start  — Start campaign (calls first 10 pending leads)

GET    /api/dashboard/stats      — Dashboard aggregated stats

POST   /api/webhooks/vapi        — Vapi webhook receiver (no auth)
GET    /health                   — Health check
```

## Common Tasks

### Add a new API route
1. Create file in `backend/src/routes/`
2. Use `authenticate` middleware for protected routes
3. Always scope queries with `organizationId: req.organizationId`
4. Register route in `backend/src/index.ts`

### Add a new database model
1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_change` locally
3. Commit the migration files
4. Railway will run `prisma migrate deploy` on next deploy

### Add a new frontend page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add nav link in `Dashboard.tsx` sidebar if needed

### Modify Vapi integration
- All Vapi calls go through `backend/src/services/vapi.ts`
- Never call Vapi directly from routes — always go through the service
- Vapi docs: https://docs.vapi.ai

## Known Limitations / TODO
- Campaign `start` only processes 10 leads per call (no background queue yet)
- No real-time call monitoring (would need WebSocket)
- Stripe products/prices not yet created — billing UI not wired
- No email verification on signup
- `shared` package types aren't imported by backend/frontend (they duplicate types locally)
- No admin panel yet
- Settings page not implemented
- Agent edit modal not wired (edit button exists but no form)

## GitHub
- **Repo:** `scorpiusstaffing/voxreach-platform`
- **Branch:** `main` (auto-deploys to Railway)
- Push to main → Railway rebuilds both services automatically
