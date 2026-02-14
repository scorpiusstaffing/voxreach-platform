# Voxreach AI Voice Agent Platform - Architecture Documentation

## Project Overview
Voxreach is a voice-first operating system for businesses that deploys AI voice agents for:
- **Outbound calls**: Sales, recruitment, lead qualification
- **Inbound calls**: Answering, booking, FAQs, routing

**Status**: MVP Complete - Production Ready
**Deployment**: Railway (Postgres + Backend + Frontend)
**Codebase**: TypeScript monorepo with workspaces

## System Architecture

### 1. Monorepo Structure
```
voxreach/
├── packages/
│   ├── shared/          # TypeScript types and enums
│   ├── backend/         # Express API + Prisma + Vapi integration
│   └── frontend/        # React + Vite + Tailwind dashboard
├── railway.toml         # Railway deployment config
└── package.json         # Root workspace config
```

### 2. Backend Architecture (`packages/backend`)

#### Core Technologies:
- **Express.js**: REST API framework
- **Prisma**: Database ORM with PostgreSQL
- **TypeScript**: Full type safety
- **JWT**: Authentication with JSON Web Tokens
- **Vapi REST API**: Voice agent platform integration

#### Database Schema (Prisma):
```prisma
// Key models:
- User: Platform users
- Organization: Companies with intent (inbound/outbound)
- Agent: AI voice agents synced with Vapi
- PhoneNumber: Phone numbers from Vapi
- Call: Call records from Vapi webhooks
- Campaign: Outbound calling campaigns
- Lead: Generated from calls
```

#### API Routes:
- `/api/auth/*`: Signup, login, organization creation
- `/api/agents/*`: Agent management with Vapi sync
- `/api/phone-numbers/*`: Phone number provisioning/import
- `/api/calls/*`: Call initiation and management
- `/api/campaigns/*`: Outbound campaign management
- `/api/webhooks/vapi`: Vapi webhook endpoint
- `/api/dashboard/*`: Analytics and metrics

#### Vapi Integration (`src/services/vapi.ts`):
- Comprehensive REST API wrapper for Vapi
- Methods for assistants, phone numbers, calls, webhooks
- Real-time sync between Vapi and local database
- Webhook signature verification for security

### 3. Frontend Architecture (`packages/frontend`)

#### Core Technologies:
- **React 18**: Component-based UI
- **Vite**: Build tool with hot reload
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

#### Key Pages:
- `/`: Landing page
- `/signup`: User registration with organization intent
- `/login`: User authentication
- `/dashboard`: Main dashboard (intent-specific)
- `/agents`: Agent creation and management
- `/phone-numbers`: Phone number provisioning
- `/calls`: Call history and management

#### UI Design Principles:
- **Fintech-inspired**: Premium, minimal, calm design
- **Intent-driven**: Different dashboards for inbound vs outbound
- **No technical jargon**: Business-friendly interface
- **Template-based**: Quick agent creation from templates

### 4. Deployment Architecture

#### Railway Services:
1. **PostgreSQL** (`postgres:17`): Primary database
2. **Backend** (Node.js): Express API service
3. **Frontend** (Node.js): React SPA served via `serve`

#### Environment Variables:
**Backend Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `VAPI_SERVER_KEY`: Vapi server API key
- `VAPI_PUBLIC_KEY`: Vapi public API key
- `STRIPE_SECRET_KEY`: Stripe API key
- `WEBHOOK_SECRET`: Vapi webhook signature secret

**Frontend Required:**
- `VITE_API_URL`: Backend API URL (baked at build time)

#### Deployment Process:
1. **GitHub Integration**: Auto-deploy on push to main
2. **Nixpacks**: Build configuration (not Dockerfiles)
3. **Start Scripts**: Custom startup in package.json
4. **Database Migrations**: `prisma db push` on backend start

### 5. Vapi Integration Details

#### Agent Creation Flow:
1. User creates agent in Voxreach UI
2. Backend calls Vapi API to create assistant
3. Vapi returns assistant ID
4. Backend stores agent with `vapiAssistantId`
5. Agent ready for calls

#### Phone Number Flow:
1. User provisions number in Voxreach UI
2. Backend calls Vapi API to get available numbers
3. User selects number
4. Backend assigns number to Vapi assistant
5. Number ready for inbound/outbound calls

#### Call Flow:
1. User initiates call from UI or campaign
2. Backend calls Vapi `/call` endpoint
3. Vapi makes phone call
4. Webhooks update call status in real-time
5. Transcript and metadata stored in database

#### Webhook Processing:
- Endpoint: `/api/webhooks/vapi`
- Events: `call.start`, `call.end`, `call.transfer`, `call.voicemail`
- Security: Signature verification with `WEBHOOK_SECRET`
- Database: Creates/updates Call and Lead records

### 6. Authentication & Security

#### JWT Implementation:
- Tokens issued on login with user+org data
- Middleware validates tokens on protected routes
- No session storage - stateless authentication

#### Organization Intent:
- Captured during signup: `inbound` or `outbound`
- Stored on Organization model
- Used for intent-specific dashboard routing

#### API Security:
- CORS configured for frontend domain
- Rate limiting on auth endpoints
- Input validation on all routes
- Error handling without sensitive data leakage

### 7. Key Design Decisions

#### 1. Monorepo with Workspaces
- **Why**: Shared types, single build process, coordinated deploys
- **Benefit**: Type safety across frontend/backend, single source of truth

#### 2. Direct Vapi REST Calls (No SDK)
- **Why**: More control, better error handling, TypeScript types
- **Benefit**: Full visibility into API interactions, easier debugging

#### 3. Template-Based Agent Creation
- **Why**: Non-technical users need guidance
- **Benefit**: Quick setup, best practices baked in, reduced cognitive load

#### 4. Intent-Driven Architecture
- **Why**: Different use cases need different interfaces
- **Benefit**: Simplified UX, focused features, better onboarding

#### 5. Railway over Other Platforms
- **Why**: Simple deployment, Postgres included, GitHub integration
- **Benefit**: Rapid iteration, minimal DevOps, production-ready scaling

### 8. Development Workflow

#### Local Development:
```bash
# Install dependencies
npm install

# Start database
docker-compose up -d

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Start backend (dev mode)
npm run dev:backend

# Start frontend (dev mode)
npm run dev:frontend
```

#### Production Deployment:
1. Push to GitHub `main` branch
2. Railway auto-deploys both services
3. Backend runs `prisma db push` on startup
4. Frontend builds with production environment variables

### 9. Testing Credentials

#### Test Users:
- Email: `browsertest@example.com`
- Password: `password123`
- Organization: "Browser Test Company"

#### Vapi Keys:
- Server Key: `ae8a926a-d8e2-4166-bdc1-8dd2cb87c6a7`
- Public Key: `c8ad5b2d-209c-47a9-a1e7-5503cd6d7fa3`
- Webhook URL: `https://backend-production-fc92.up.railway.app/api/webhooks/vapi`

#### Railway URLs:
- Backend: https://backend-production-fc92.up.railway.app
- Frontend: https://frontend-production-896c.up.railway.app

### 10. Known Issues & Solutions

#### 1. Frontend Environment Variables
- **Issue**: Vite needs env vars at build time, not runtime
- **Solution**: `.env.production` file baked into build

#### 2. Database Migrations
- **Issue**: No migration history in repo
- **Solution**: Using `prisma db push` instead of `migrate deploy`
- **Future**: Create proper migration files

#### 3. Vapi Voice Selection
- **Issue**: Limited to Vapi-provided voices
- **Solution**: Use voice IDs from Vapi list (Savannah, Elliot, etc.)
- **Future**: Integrate 11labs with custom credentials

### 11. Future Enhancements

#### Phase 2 (Revenue Generation):
1. Stripe subscription integration
2. Usage-based billing
3. Team collaboration features
4. Advanced analytics dashboard

#### Phase 3 (Scale):
1. Twilio integration for international numbers
2. AWS S3 for call recording storage
3. Custom domain support
4. Email notifications system

#### Phase 4 (Enterprise):
1. SSO integration
2. API key management
3. Custom voice training
4. Compliance features (HIPAA, GDPR)

## Summary

Voxreach is a production-ready AI voice agent platform that enables businesses to:
1. Create AI voice agents in minutes (no technical knowledge)
2. Get phone numbers instantly (free US numbers available)
3. Make outbound sales/recruitment calls
4. Handle inbound customer support
5. Track performance with call analytics

The architecture is designed for:
- **Simplicity**: Business owners can use it immediately
- **Scalability**: Ready for thousands of agents and calls
- **Maintainability**: Clean code with TypeScript safety
- **Extensibility**: Easy to add new features and integrations

**Current Status**: MVP Complete - Ready for first customers and revenue generation.