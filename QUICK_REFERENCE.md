# Voxreach - Quick Reference for Models

## TL;DR - What We Built
- **AI Voice Agent Platform** for outbound/inbound calls
- **MVP Complete**: Backend + Frontend deployed on Railway
- **Vapi Integration**: Full sync with voice agent platform
- **Ready for customers**: Business owners can create agents in minutes

## Critical URLs
- **Frontend**: https://frontend-production-896c.up.railway.app
- **Backend**: https://backend-production-fc92.up.railway.app
- **Webhook**: https://backend-production-fc92.up.railway.app/api/webhooks/vapi
- **GitHub**: scorpiusstaffing/voxreach-platform
- **Vapi Dashboard**: https://dashboard.vapi.ai

## Test Credentials
```
Email: browsertest@example.com
Password: password123
```

## Vapi Keys
```
Server: ae8a926a-d8e2-4166-bdc1-8dd2cb87c6a7
Public: c8ad5b2d-209c-47a9-a1e7-5503cd6d7fa3
```

## Railway Project
- **Project ID**: 26928579-ba21-42e3-a2a8-be1616dc27ab
- **Workspace**: Scorpius (12149ed5-2ca2-4594-83bf-97a9f319246d)
- **Environment**: production (c3b7d3ea-7c9a-44d6-ad1d-947d3c989f5c)

## Services
1. **Postgres**: cbd85ae1-ce59-4928-837c-71c0e48215b6
2. **Backend**: 6b3c4f99-c744-4272-a0f5-26c48c4b4b22
3. **Frontend**: 7ae93c32-e3d9-419e-b0d5-0488cab16987

## Code Structure
```
/Projects/voxreach/
├── packages/
│   ├── shared/     # Types: Agent, Call, User, etc.
│   ├── backend/    # Express API + Prisma + Vapi
│   └── frontend/   # React + Vite + Tailwind
├── ARCHITECTURE.md # Full documentation
└── QUICK_REFERENCE.md # This file
```

## Key Files
- `packages/backend/src/services/vapi.ts` - Vapi REST API wrapper
- `packages/backend/prisma/schema.prisma` - Database schema
- `packages/frontend/.env.production` - Production API URL
- `packages/frontend/src/lib/api.ts` - Frontend API client

## Common Issues & Fixes

### 1. Frontend API Errors
- **Symptom**: "Unexpected end of JSON input"
- **Cause**: VITE_API_URL not set at build time
- **Fix**: Update `packages/frontend/.env.production` and redeploy

### 2. Database Tables Missing
- **Symptom**: Prisma errors about missing tables
- **Cause**: `prisma db push` not running on deploy
- **Fix**: Ensure backend `package.json` start script includes: `"prisma db push --accept-data-loss && node dist/index.js"`

### 3. Vapi Voice Creation Fails
- **Symptom**: "Couldn't Find 11labs Voice" error
- **Cause**: Using unsupported voice provider/ID
- **Fix**: Use Vapi-provided voices: Savannah, Elliot, Kylie, etc.

### 4. Webhook Not Receiving Events
- **Symptom**: Calls not updating in database
- **Cause**: Webhook URL not configured in Vapi
- **Fix**: Set webhook in Vapi dashboard to: `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`

## Development Commands
```bash
# Root directory
cd /Users/jonathan/.openclaw/workspace/Projects/voxreach

# Install all dependencies
npm install

# Start backend (dev)
npm run dev:backend

# Start frontend (dev)
npm run dev:frontend

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Check Railway status
railway status
```

## Deployment Flow
1. Push to GitHub `main` branch
2. Railway auto-deploys both services
3. Backend runs database migrations on startup
4. Frontend builds with production env vars

## What's Working
✅ Authentication (signup/login)
✅ Agent creation with Vapi sync
✅ Phone number provisioning
✅ Call initiation and tracking
✅ Webhook processing
✅ Dashboard with intent-specific views

## What's Next (Post-MVP)
1. Stripe billing integration
2. Twilio for international numbers
3. AWS S3 for recordings
4. Custom domain
5. Analytics dashboard

## Bug-Fix Protocol (For Models)
1. **Opus** → Quick diagnosis only (minimal tokens)
2. **DeepSeek** → Actual fix work (coding, pushing, testing)
3. **Loop** → If fix fails, report back to Opus
4. **Escalate** → Complex analysis to Kimi K2.5

**Rule**: "Opus is the surgeon's eye, DeepSeek is the hands. Kimi is the backup brain."

## Business Value
- **Target**: Non-technical business owners
- **Value Prop**: Create AI voice agents in minutes, no coding
- **Revenue Model**: Subscription + usage-based billing
- **Market**: Sales, recruitment, customer support automation

## Last Updated
2026-02-14 - MVP Complete, Production Ready