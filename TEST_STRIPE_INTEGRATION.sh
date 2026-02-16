#!/bin/bash

echo "🔍 Testing Stripe Integration Setup"
echo "==================================="

# Test 1: Backend Health
echo -n "1. Backend Health Check: "
HEALTH=$(curl -s https://backend-production-fc92.up.railway.app/health | jq -r '.status' 2>/dev/null)
if [ "$HEALTH" = "ok" ]; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Test 2: Billing Plans Endpoint
echo -n "2. Billing Plans Endpoint: "
PLANS_RESPONSE=$(curl -s https://backend-production-fc92.up.railway.app/api/billing/plans)
if echo "$PLANS_RESPONSE" | grep -q "plans"; then
  echo "✅ OK (Endpoint exists)"
  
  # Check if Stripe price IDs are in response
  if echo "$PLANS_RESPONSE" | grep -q "price_"; then
    echo "   ✅ Stripe Price IDs found"
  else
    echo "   ⚠️  Stripe Price IDs missing (env vars not set?)"
  fi
else
  echo "❌ FAILED or 401 (auth required)"
fi

# Test 3: Stripe Products Exist
echo -n "3. Stripe Products: "
echo "⚠️  Manual check required - visit https://dashboard.stripe.com/products"
echo "   Should see: VoxReach Starter ($99) and VoxReach Professional ($199)"

# Test 4: Stripe Webhook
echo -n "4. Stripe Webhook: "
echo "⚠️  Manual check required - visit https://dashboard.stripe.com/webhooks"
echo "   Should see endpoint: https://backend-production-fc92.up.railway.app/api/webhooks/stripe"
if echo "$WEBHOOKS" | grep -q "backend-production-fc92.up.railway.app"; then
  echo "✅ Configured"
else
  echo "❌ Not found"
fi

echo ""
echo "📋 Summary:"
echo "==========="
echo "If all tests show ✅, Stripe integration is READY!"
echo ""
echo "If Test 2 shows ⚠️, you need to set Railway environment variables."
echo "Follow instructions in IMMEDIATE_SETUP.md"
echo ""
echo "Once environment variables are set, run:"
echo "  ./TEST_STRIPE_INTEGRATION.sh"
echo "to verify everything is working."