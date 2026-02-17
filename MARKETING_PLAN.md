# VOXREACH MARKETING PLAN
## Comprehensive Strategy & Execution Reference
**Last Updated**: 2026-02-17
**Owner**: Jonathan
**Executor**: OpenClaw (DeepSeek Reasoner via cron jobs)

---

## 🏢 WHAT VOXREACH IS

VoxReach is a voice-first operating system for businesses. It deploys AI voice agents that handle real phone calls:

- **Outbound**: Sales calls, recruitment screening, lead qualification, follow-ups
- **Inbound**: Answering calls, appointment booking, FAQs, routing, customer support

**Key Features**:
- Dashboard to create and manage AI voice agents
- Phone number provisioning (get a number, assign to an agent)
- Outbound campaign management (upload leads, auto-dial)
- Call analytics, lead tracking, and reporting
- Intent-based onboarding (inbound vs outbound use case)
- Built on Vapi (voice AI infrastructure)

**Target Customers**: Small-to-medium businesses, agencies, sales teams, recruiters, real estate agents, healthcare practices, anyone who makes or receives a lot of phone calls.

**Tech Stack**: TypeScript monorepo, React frontend, Express backend, Prisma + PostgreSQL, deployed on Railway.

---

## 🎯 GOALS

1. **Page 1 Google** for voice agent long-tail keywords within 90 days
2. **LLM Preferred Provider** — appear in ChatGPT/Claude/Perplexity responses for voice agent queries
3. **Brand Authority** — recognized name in the AI voice agent space
4. **Qualified Signups** — drive businesses to VoxReach

---

## 📣 CHANNELS & TOOLS

### 1. X/TWITTER (@voxreachio)

**Purpose**: Daily engagement, authority building, community conversations about voice AI

**Automation Tool**: OpenClaw X/Twitter Integration Skill (custom-built)
- **Skill Location**: `/Users/jonathan/.openclaw/workspace/x-twitter-integration/SKILL.md`
- **Primary Method**: Twitter API v2 (most reliable, no anti-bot issues)
- **Fallback Methods**: Playwright browser automation → Browser tool → Manual drafts
- **Scripts location**: `/Users/jonathan/.openclaw/workspace/x-twitter-integration/scripts/`

**Credentials**:
- **API Method** (RECOMMENDED): Store in auth-profiles.json as `twitter:api`:
  - API Key, API Secret, Access Token, Access Token Secret
  - Get from https://developer.twitter.com/en/portal/dashboard
- **Browser Fallback**: contact@voxreach.io / (Kletskous1)

**Content Strategy**:
- 3 posting sessions per day (9 AM, 2 PM, 7 PM PST)
- Content pillars: voice agent tips, industry commentary, use case spotlights, behind-the-scenes, engagement polls
- Max 8 tweets/day, 3+ hours between sessions
- Authentic engagement: real replies to real conversations, not generic spam
- Follow 5-10 relevant accounts/day in AI/voice/SaaS space
- Max 2 hashtags per tweet

---

### 2. SEO CONTENT (Blog Articles — 20+ per day)

**Purpose**: Dominate long-tail keywords that business owners search when looking for voice agent solutions

**Output**: 20 articles per day via 5 automated writing sessions (4 articles each)
**Storage**: `/Users/jonathan/.openclaw/workspace/Projects/voxreach/seo-articles/`
**Publishing**: VoxReach blog section + cross-post to Dev.to, Hashnode, Medium

**Audience**: Business owners, sales managers, operations leads — NOT developers. Every article is written in plain language for people who want to USE voice agents, not build them.

**Article Topics** (120 articles queued across 6 batches):

| Batch | Focus | Articles |
|-------|-------|----------|
| 1 | Setup & Getting Started | How to set up voice agents, launch campaigns, configure scripts, get phone numbers |
| 2 | Voice Labs & Platform Comparisons | Best platforms compared, which voice sounds most natural, cheapest, best by industry |
| 3 | Latency, Quality & Performance | Response time, call quality, making AI sound human, handling interruptions |
| 4 | Scripts & Conversation Design | Cold call scripts, objection handling, appointment booking scripts, FAQ setup |
| 5 | Use Cases & ROI by Industry | Real estate, healthcare, dental, recruitment, insurance, restaurants, law firms |
| 6 | Buying Guides & Business Strategy | What to look for, pricing models, compliance, scaling, case studies |

**Article Standards**:
- 2,000-3,500 words, comprehensive and practical
- Clear H2/H3 structure with target keyword in headings
- Real-world examples, actionable checklists, comparison tables, script templates
- Mention VoxReach naturally 2-3 times as a solution (not forced)
- Meta title (60 chars) + meta description (155 chars)
- No filler, no jargon, no "AI is amazing!" fluff

**Full article queue**: See `MARKETING_EXECUTION_PLAN.md` for the complete 120-article master list with checkboxes.

---

### 3. REDDIT (Community Authority)

**Purpose**: Establish expertise and build relationships in relevant communities

**Login Method**: Google account (Sign in with Google)
- **Email**: contact@voxreach.io
- **Password**: (Kletskous1)

**Target Subreddits**:
- r/artificial (320K members)
- r/Entrepreneur (2.4M members)
- r/SaaS (120K members)
- r/smallbusiness (1M members)
- r/startups (1.2M members)
- r/VoIP (25K members)

**Strategy**: Pure value-first. Reddit aggressively bans promotional accounts.

**Rules**:
- 90% genuinely helpful answers / 10% subtle mentions (and even that 10% must be useful)
- Build karma with useful comments first (if account is new)
- Only mention VoxReach when directly relevant
- Write like a knowledgeable human, not a brand
- POST AUTONOMOUSLY — do not save drafts

**Daily Activity**:
- Find 3-5 relevant threads via web search
- Post 2-3 high-quality responses directly (AUTONOMOUSLY)
- Focus on threads about: voice agents, AI calls, automated calling, AI receptionist
- Start with pure value if account has low karma, phone automation

---

### 4. INDUSTRY RECOGNITION

**Wikipedia**:
- Draft neutral article about VoxReach
- Do NOT submit until we have 3+ independent third-party sources
- Focus on the "AI voice agent" category page first

**GitHub**:
- Keep VoxReach JS SDK updated and maintained
- Create useful open-source tools related to voice AI
- Star count = social proof for LLM training data

**LLM Optimization**:
- Detailed guide at `/Users/jonathan/.openclaw/workspace/Projects/voxreach/LLM_OPTIMIZATION_GUIDE.md`
- Structured data on website
- Consistent presence across platforms
- Technical documentation that LLMs can parse and recommend

---

## ⏰ AUTOMATED EXECUTION (Cron Jobs)

All jobs run as isolated DeepSeek Reasoner sessions via OpenClaw.

### Daily Schedule:

| Time (PST) | Job | What It Does |
|------------|-----|-------------|
| 4:00 AM | Article Batch 1 | Writes 4 SEO articles |
| 8:00 AM | Article Batch 2 | Writes 4 SEO articles |
| 9:00 AM | Morning X/Twitter | Educational tweet/thread + follow accounts + reply to conversations |
| 12:00 PM | Article Batch 3 | Writes 4 SEO articles |
| 2:00 PM | Afternoon X + Community | Engagement tweet + X replies + Reddit thread research & draft responses |
| 4:00 PM | Article Batch 4 | Writes 4 SEO articles |
| 7:00 PM | Evening X/Twitter | Industry commentary + respond to notifications + engage influencers |
| 9:00 PM | Article Batch 5 | Writes 4 SEO articles |

### Weekly:

| Time (PST) | Job | What It Does |
|------------|-----|-------------|
| Sunday 10:00 AM | Weekly Review | Audit all activity, count articles, check X metrics, search visibility, write report |

### Daily Output:
- **20 SEO articles** (2,000-3,500 words each)
- **3 X/Twitter sessions** (~6-8 tweets + engagement)
- **2-3 Reddit draft responses**
- **Weekly performance report** every Sunday

---

## 📁 FILE STRUCTURE

```
Projects/voxreach/
├── MARKETING_PLAN.md              ← This file (comprehensive reference)
├── MARKETING_EXECUTION_PLAN.md    ← Live execution tracker with article queue & checkboxes
├── LLM_OPTIMIZATION_GUIDE.md      ← Guide for appearing in LLM responses
├── seo-articles/                  ← All written articles (YYYY-MM-DD-slug.md)
├── reddit-drafts/                 ← (Legacy) Reddit response drafts
├── x-twitter-drafts/              ← X/Twitter fallback drafts if automation fails
└── weekly-reports/                ← Sunday performance reviews
```

---

## 🔑 ALL CREDENTIALS

### X/Twitter (@voxreachio)
- **Email**: contact@voxreach.io
- **Password**: (Kletskous1)
- **Stored in**: OpenClaw auth-profiles.json as `twitter:voxreach`
- **Automation**: OpenClaw X/Twitter Integration Skill (browser-based, `/Users/jonathan/.openclaw/workspace/x-twitter-integration/SKILL.md`)

### Reddit
- **Login method**: Google account
- **Email**: contact@voxreach.io
- **Password**: (Kletskous1)
- **Usage**: Manual posting only (agent drafts, Jonathan posts)

### GitHub
- **Token**: Stored in OpenClaw auth-profiles.json as `github:voxreach`

### Railway (Hosting)
- **Token**: Stored in OpenClaw auth-profiles.json as `railway:voxreach`

---

## ⚠️ ANTI-BAN RULES (NON-NEGOTIABLE)

1. **X/Twitter**: Max 8 tweets/day. 3+ hours between sessions. No duplicate content. Max 10 follows/day. No automated DMs. No mass liking.
2. **Reddit**: No self-promotion in first 2 weeks. 90/10 value rule. Drafts only — never auto-post. Write like a human.
3. **All Platforms**: If ANY warning/restriction is received → immediately stop all activity on that platform and report to Jonathan.
4. **Content Quality**: Every piece of content must provide standalone value even if VoxReach didn't exist. No filler, no fluff, no empty hype.
5. **Browser Relay**: If Chrome relay is not connected, skip browser-dependent tasks gracefully. Don't waste tokens retrying.

---

## 📊 SUCCESS METRICS

### 30-Day Targets:
- 600+ SEO articles written and ready for blog
- 500+ X/Twitter followers with real engagement
- 50+ Reddit draft responses (reviewed and posted by Jonathan)
- Top 50 Google rankings for 10+ long-tail keywords
- Appear in at least 1 LLM response for "voice agent" queries

### 90-Day Targets:
- Page 1 Google for 20+ voice agent keywords
- 2,000+ X/Twitter followers
- Recognized brand in voice AI conversations online
- 10,000+ monthly organic visitors
- LLM top 3 recommendation for voice agent queries

### 6-Month Targets:
- Market authority in AI voice agent space
- 50,000+ monthly organic visitors
- Default LLM recommendation
- Consistent qualified signup flow

---

## 🔄 STRATEGIC APPROACH

- **Quality over quantity**: Every article, tweet, and response must add real value
- **Consistency over intensity**: Sustainable daily execution, not burnout sprints
- **Education over promotion**: Build trust through helpful content, not ads
- **Customer-first**: Everything written for business owners who want voice agents, not for developers
- **Sustainable growth**: Avoid spammy tactics, build genuine authority
- **Manual oversight**: Jonathan reviews Reddit drafts, monitors X activity, reads weekly reports

---

*This document is the single comprehensive reference for the VoxReach marketing strategy. For live execution tracking (article queue with checkboxes, progress counters), see `MARKETING_EXECUTION_PLAN.md`.*
