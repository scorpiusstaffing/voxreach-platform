#!/bin/bash

# VoxReach Maintenance Mode Deployment Script
# This script deploys the under construction mode to Railway

echo "🚀 Deploying VoxReach Maintenance Mode..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in VoxReach root directory"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd packages/frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ../..

# Build backend
echo "⚙️  Building backend..."
cd packages/backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
cd ../..

# Run security audit
echo "🔒 Running security audit..."
node security-audit.js
if [ $? -ne 0 ]; then
    echo "⚠️  Security audit found issues (check above)"
    read -p "Continue deployment anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Deploy to Railway
echo "🚂 Deploying to Railway..."
if command -v railway &> /dev/null; then
    railway up --service backend
    if [ $? -ne 0 ]; then
        echo "❌ Backend deployment failed"
        exit 1
    fi
    
    railway up --service frontend
    if [ $? -ne 0 ]; then
        echo "❌ Frontend deployment failed"
        exit 1
    fi
else
    echo "⚠️  Railway CLI not found. Skipping deployment."
    echo "To deploy manually:"
    echo "  1. Push to GitHub (main branch auto-deploys)"
    echo "  2. Or install Railway CLI: npm i -g @railway/cli"
    echo "  3. Then run: railway up"
fi

echo "✅ Maintenance mode deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://voxreach.io to see under construction page"
echo "2. Test API endpoints (should return 503 for most routes)"
echo "3. Monitor logs: railway logs --service backend"
echo ""
echo "🔧 To disable maintenance mode:"
echo "   - Set UNDER_CONSTRUCTION=false in frontend/src/App.tsx"
echo "   - Set MAINTENANCE_MODE=false in backend/src/middleware/maintenance.ts"
echo "   - Redeploy: ./deploy-maintenance.sh"