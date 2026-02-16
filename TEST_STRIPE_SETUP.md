# Test Stripe Setup

## Quick Test Commands:

### 1. Test Health Endpoint:
```bash
curl https://backend-production-fc92.up.railway.app/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### 2. Test Billing Routes (after setting env vars):
```bash
# Get available plans
curl https://backend-production-fc92.up.railway.app/api/billing/plans

# Will return 401 without auth token, but shows route is working
```

### 3. Test Webhook Endpoint:
```bash
# Test if webhook endpoint exists
curl -X POST https://backend-production-fc92.up.railway.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```
Should return signature error (which means endpoint is working)

## Verification Checklist:

### ✅ Backend Deployment:
- [ ] Code pushed to GitHub
- [ ] Railway auto-deployed
- [ ] Health endpoint working

### ✅ Environment Variables (Railway):
- [ ] `STRIPE_SECRET_KEY` set
- [ ] `STRIPE_PUBLISHABLE_KEY` set  
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `STRIPE_STARTER_PRICE_ID` set (after creating in Stripe)
- [ ] `STRIPE_PROFESSIONAL_PRICE_ID` set (after creating in Stripe)

### ✅ Stripe Dashboard:
- [ ] Products created (Starter $99, Professional $199)
- [ ] Price IDs copied
- [ ] Webhook endpoint created
- [ ] Webhook secret verified

## Next: Frontend Implementation

Once environment variables are set, I'll:
1. Build pricing page with marketing copy
2. Create checkout flow
3. Add upgrade triggers to dashboard
4. Implement usage tracking
5. Add billing management page

**Estimated time:** 2-3 days for complete frontend integration