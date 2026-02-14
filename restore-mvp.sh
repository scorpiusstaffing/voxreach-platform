#!/bin/bash

echo "🚀 Voxreach MVP Restoration Script"
echo "=================================="
echo ""
echo "This script helps restore the Voxreach platform to its MVP-complete state."
echo "Use this if the production deployment breaks or needs to be recreated."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Prerequisites:${NC}"
echo "1. GitHub access to scorpiusstaffing/voxreach-platform"
echo "2. Railway CLI installed (brew install railway)"
echo "3. Railway account with access to Voxreach project"
echo ""

read -p "Continue with restoration? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

echo ""
echo -e "${GREEN}Step 1: Clone from backup branch${NC}"
echo "----------------------------------------"

# Create timestamp for backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="voxreach-restore-$TIMESTAMP"

git clone -b backup/mvp-complete-2026-02-14 \
  https://github.com/scorpiusstaffing/voxreach-platform \
  $BACKUP_DIR

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to clone repository${NC}"
    exit 1
fi

cd $BACKUP_DIR
echo -e "${GREEN}✅ Code restored to: $(pwd)${NC}"

echo ""
echo -e "${GREEN}Step 2: Install dependencies${NC}"
echo "---------------------------------"

npm install
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  npm install had issues, but continuing...${NC}"
fi

echo ""
echo -e "${GREEN}Step 3: Generate Prisma client${NC}"
echo "-----------------------------------"

cd packages/backend
npx prisma generate
cd ../..
echo -e "${GREEN}✅ Prisma client generated${NC}"

echo ""
echo -e "${GREEN}Step 4: Railway Deployment Instructions${NC}"
echo "---------------------------------------------"

cat << EOF

🚂 ${YELLOW}Railway Deployment Steps:${NC}

1. ${GREEN}Login to Railway:${NC}
   railway login

2. ${GREEN}Link to Voxreach project:${NC}
   railway link 26928579-ba21-42e3-a2a8-be1616dc27ab

3. ${GREEN}Deploy to Railway:${NC}
   railway up

   Or deploy specific services:
   railway up --service backend
   railway up --service frontend

4. ${GREEN}Set environment variables (if not auto-detected):${NC}

   ${YELLOW}Backend Variables:${NC}
   DATABASE_URL=postgresql://postgres:[password]@[host].railway.app:5432/railway
   JWT_SECRET=[generate-a-secret]
   VAPI_SERVER_KEY=ae8a926a-d8e2-4166-bdc1-8dd2cb87c6a7
   VAPI_PUBLIC_KEY=c8ad5b2d-209c-47a9-a1e7-5503cd6d7fa3
   STRIPE_SECRET_KEY=sk_test_xxx # Get from TOOLS.md
   WEBHOOK_SECRET=[generate-a-secret]

   ${YELLOW}Frontend Variables:${NC}
   VITE_API_URL=https://backend-[id].up.railway.app/api

5. ${GREEN}Configure Vapi webhook:${NC}
   Go to https://dashboard.vapi.ai → Webhooks
   Set URL to: https://backend-[id].up.railway.app/api/webhooks/vapi

EOF

echo ""
echo -e "${GREEN}Step 5: Verification${NC}"
echo "------------------------"

cat << EOF

🌐 ${YELLOW}Once deployed, verify with:${NC}

1. ${GREEN}Backend health:${NC}
   curl https://backend-[id].up.railway.app/health

2. ${GREEN}Frontend load:${NC}
   curl -I https://frontend-[id].up.railway.app

3. ${GREEN}Test authentication:${NC}
   curl -X POST https://backend-[id].up.railway.app/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email":"browsertest@example.com","password":"password123"}'

🔐 ${YELLOW}Test Credentials:${NC}
- Email: browsertest@example.com
- Password: password123

📚 ${YELLOW}Documentation:${NC}
- ARCHITECTURE.md - Complete system architecture
- QUICK_REFERENCE.md - Quick reference guide
- DEPLOYMENT_SNAPSHOT.md - This restoration guide

EOF

echo ""
echo -e "${GREEN}✅ Restoration setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Follow Railway deployment instructions above"
echo "2. Set environment variables in Railway dashboard"
echo "3. Configure Vapi webhook URL"
echo "4. Test the deployed application"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC} The backup branch contains the exact MVP state."
echo "    Future development should continue from the main branch."
echo ""
echo "Backup location: $(pwd)"
echo "Restoration timestamp: $TIMESTAMP"