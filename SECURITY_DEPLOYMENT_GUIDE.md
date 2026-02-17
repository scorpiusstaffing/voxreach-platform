# 🔒 VoxReach Security Deployment Guide

## **BEFORE DEPLOYING TO PRODUCTION**

### **1. ENVIRONMENT VARIABLES (CRITICAL)**

#### **Backend (.env.production)**
```env
# Database - Use Railway/Heroku/AWS RDS connection string
DATABASE_URL="postgresql://[username]:[strong-password]@[host]:5432/voxreach_production"

# JWT - Generate with: openssl rand -base64 32
JWT_SECRET="generated-strong-random-secret-here"

# Vapi - Get from Vapi dashboard
VAPI_SERVER_KEY="live_vapi_server_key_here"
VAPI_PUBLIC_KEY="live_vapi_public_key_here"

# Stripe - Switch to LIVE keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_live_..."
STRIPE_STARTER_PRICE_ID="price_starter_live"
STRIPE_PROFESSIONAL_PRICE_ID="price_professional_live"

# App
FRONTEND_URL="https://app.voxreach.io"
WEBHOOK_URL="https://backend.voxreach.io"
PORT="3001"
NODE_ENV="production"
```

#### **Frontend (.env.production)**
```env
VITE_API_URL="https://backend.voxreach.io/api"
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### **2. DATABASE SECURITY**

```sql
-- Create separate production database
CREATE DATABASE voxreach_production;

-- Create dedicated user with limited permissions
CREATE USER voxreach_prod WITH PASSWORD 'strong-password-here';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE voxreach_production TO voxreach_prod;
GRANT USAGE ON SCHEMA public TO voxreach_prod;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO voxreach_prod;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO voxreach_prod;

-- Enable SSL (if supported)
ALTER DATABASE voxreach_production SET ssl = on;
```

### **3. SSL/TLS CERTIFICATES**

```bash
# Use Let's Encrypt for free SSL certificates
certbot certonly --nginx -d voxreach.io -d www.voxreach.io -d app.voxreach.io

# Or use Railway/Heroku managed SSL
```

### **4. SECURITY HEADERS (NGINX CONFIG)**

```nginx
# Add to your nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.vapi.ai https://api.stripe.com; frame-src 'self' https://js.stripe.com;" always;

# HSTS (only after confirming SSL works)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### **5. FIREWALL RULES**

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (for Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Backend API (if exposed)
sudo ufw enable
```

### **6. MONITORING & LOGGING**

```bash
# Install fail2ban for brute force protection
sudo apt install fail2ban

# Configure log rotation
sudo nano /etc/logrotate.d/voxreach

# Monitor with:
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **7. REGULAR SECURITY CHECKS**

#### **Automated Security Audit**
```bash
# Run security audit before each deployment
cd /path/to/voxreach
node security-audit.js

# Check for vulnerable dependencies
npm audit
npm outdated
```

#### **Database Backups**
```bash
# Daily automated backups
pg_dump voxreach_production > backup_$(date +%Y%m%d).sql

# Encrypt backups
gpg --encrypt --recipient security@voxreach.io backup_$(date +%Y%m%d).sql
```

### **8. INCIDENT RESPONSE PLAN**

#### **Compromised API Key**
1. **Immediate Action**: Revoke key in provider dashboard
2. **Rotation**: Generate new key, update all environments
3. **Investigation**: Check logs for unauthorized access
4. **Notification**: Inform affected users if necessary

#### **Data Breach**
1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope of breach
3. **Notify**: Legal requirements (72 hours for GDPR)
4. **Remediate**: Fix vulnerability, reset credentials

### **9. COMPLIANCE CHECKLIST**

- [ ] **GDPR**: Data processing agreements, user consent, right to erasure
- [ ] **PCI DSS**: If handling credit cards directly (use Stripe for compliance)
- [ ] **SOC 2**: For enterprise customers (future consideration)
- [ ] **Privacy Policy**: Clearly state data collection/usage
- [ ] **Terms of Service**: Include liability limitations

### **10. SECURITY TESTING SCHEDULE**

| Frequency | Test | Tool |
|-----------|------|------|
| Daily | Dependency scanning | `npm audit`, Dependabot |
| Weekly | Security headers check | securityheaders.com |
| Monthly | Penetration testing | OWASP ZAP, Burp Suite |
| Quarterly | Code security audit | `security-audit.js`, manual review |
| Annually | Third-party audit | Hire security firm |

### **11. EMERGENCY CONTACTS**

```
Security Team: security@voxreach.io
Hosting Provider: Railway/Heroku/AWS support
SSL Certificate: Let's Encrypt
Domain Registrar: Namecheap/GoDaddy
```

### **12. POST-DEPLOYMENT VERIFICATION**

```bash
# Test security headers
curl -I https://voxreach.io

# Test SSL configuration
ssl Labs: https://www.ssllabs.com/ssltest/

# Test CORS configuration
curl -H "Origin: https://malicious.com" -I https://api.voxreach.io

# Test rate limiting
for i in {1..150}; do curl https://api.voxreach.io/health; done
```

## **🚨 IMMEDIATE ACTIONS REQUIRED**

1. **Generate production JWT secret**: `openssl rand -base64 32`
2. **Switch to Stripe live keys**: Dashboard → Developers → API Keys
3. **Set up production database**: Railway/Heroku PostgreSQL
4. **Configure SSL certificates**: Let's Encrypt or provider SSL
5. **Update CORS origins**: Add your production domains
6. **Set up monitoring**: Logging, alerts, backups

## **📞 SUPPORT**

For security concerns: security@voxreach.io  
For urgent issues: +1-XXX-XXX-XXXX (on-call rotation)

---

**Last Updated**: 2026-02-16  
**Next Security Review**: 2026-03-16