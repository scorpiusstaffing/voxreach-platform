# Google Search Console Setup Guide

## Why Google Search Console is Essential

Google Search Console (GSC) is a **free tool** that shows how Google sees your website. It's critical for SEO because it:

1. **Shows search performance** - What keywords you rank for, clicks, impressions
2. **Identifies technical issues** - Crawl errors, mobile usability, security issues
3. **Submits sitemaps** - Tell Google about your pages
4. **Monitors indexing** - See which pages are indexed
5. **Provides rich results testing** - Test structured data

## Step-by-Step Setup

### Step 1: Verify Ownership

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Start now"
3. Enter your domain: `voxreach.io`
4. Choose verification method (recommended: DNS verification)

### Step 2: DNS Verification

1. **Add TXT record** to your domain's DNS:
   ```
   Name: @ (or leave blank)
   Type: TXT
   Value: google-site-verification=XXXXXXXXXXXXX
   TTL: 3600
   ```

2. Wait 24-48 hours for propagation
3. Click "Verify" in Search Console

### Step 3: Submit Sitemap

1. Once verified, go to "Sitemaps" in left menu
2. Enter sitemap URL: `https://voxreach.io/sitemap.xml`
3. Click "Submit"
4. Also submit: `https://voxreach.io/sitemap-index.xml`

### Step 4: Configure Settings

#### 1. **Target Country**
- Go to Settings → Targeting
- Select "United States" (or your target market)
- This helps with local rankings

#### 2. **URL Parameters**
- Go to Settings → URL Parameters
- For now, leave as default
- Configure later if you have duplicate content issues

#### 3. **Crawl Stats**
- Monitor under Settings → Crawl Stats
- Ensure Google is crawling your site regularly

## Key Reports to Monitor

### 1. **Performance Report**
**Location**: Performance → Search Results
**What to check daily**:
- Total clicks (should increase over time)
- Total impressions (shows visibility)
- Average position (track improvements)
- Click-through rate (CTR)

### 2. **Index Coverage**
**Location**: Index → Coverage
**What to check weekly**:
- Valid pages (should match your page count)
- Errors (fix immediately)
- Excluded pages (understand why)

### 3. **Mobile Usability**
**Location**: Experience → Mobile Usability
**What to check monthly**:
- Mobile-friendly pages (should be 100%)
- Issues (fix promptly)

### 4. **Core Web Vitals**
**Location**: Experience → Core Web Vitals
**What to check monthly**:
- Page experience (should be "Good")
- Issues (prioritize fixing)

### 5. **Links Report**
**Location**: Links
**What to check weekly**:
- External links (track growth)
- Internal links (ensure good structure)
- Top linking pages

## Immediate Actions After Setup

### Day 1:
1. Submit sitemap
2. Request indexing of key pages:
   - Homepage
   - Main product page
   - Blog index
   - Key landing pages

### Day 2-7:
1. Check for crawl errors
2. Monitor initial impressions
3. Set up email alerts for errors

### Week 2:
1. Analyze search queries
2. Identify low-hanging fruit keywords
3. Check mobile usability

## Advanced Configuration

### 1. **Property Sets** (if you have multiple properties)
- Group related properties
- Get aggregated reports
- Useful for subdomains or regional sites

### 2. **Disavow Tool** (use with caution)
- Location: Security & Manual Actions → Disavow Links
- Only use if you have toxic backlinks
- Consult SEO expert before using

### 3. **URL Inspection Tool**
- Test individual URLs
- See how Google renders them
- Request indexing for updated pages

### 4. **Rich Results Test**
- Test structured data
- Ensure rich snippets work
- Fix errors for better CTR

## Integration with Other Tools

### Google Analytics 4
1. Link Search Console to GA4
2. See organic search data in GA4
3. Track conversions from organic search

### Google Ads (if using)
1. Link accounts
2. See search query data
3. Inform keyword strategy

### Third-party SEO Tools
Most SEO tools can import GSC data for:
- Rank tracking
- Competitor analysis
- Reporting

## Common Issues and Solutions

### Issue 1: "Discovered - currently not indexed"
**Solution**: 
1. Ensure page has unique, quality content
2. Improve internal linking
3. Request indexing via URL Inspection tool

### Issue 2: Mobile usability errors
**Solution**:
1. Test with Google's Mobile-Friendly Test
2. Fix viewport issues
3. Improve tap targets size

### Issue 3: Slow page speed
**Solution**:
1. Use PageSpeed Insights
2. Optimize images
3. Enable compression
4. Reduce server response time

### Issue 4: Security issues
**Solution**:
1. Fix immediately (malware, hacking)
2. Request review after fixing
3. Enhance security measures

## Best Practices

### Daily:
- Check for critical errors
- Monitor significant traffic drops

### Weekly:
- Review performance report
- Check index coverage
- Analyze search queries

### Monthly:
- Review mobile usability
- Check Core Web Vitals
- Analyze links growth
- Update sitemap if new pages

### Quarterly:
- Comprehensive audit
- Competitor analysis
- Strategy review

## Tracking Progress

### Key Metrics to Track:
1. **Organic clicks** (primary success metric)
2. **Average position** for target keywords
3. **Indexed pages** count
4. **Crawl errors** (should decrease)
5. **Mobile usability** (should be 100%)

### Setting Goals:
- Month 1: 100 organic clicks
- Month 3: 500 organic clicks  
- Month 6: 2,000 organic clicks
- Month 12: 10,000 organic clicks

## Automation and Alerts

### Email Alerts to Enable:
1. **Crawl errors** (critical)
2. **Security issues** (critical)
3. **Manual actions** (critical)
4. **Index coverage issues** (important)
5. **Mobile usability** (important)

### Automated Reports:
1. Weekly performance summary
2. Monthly comprehensive report
3. Quarterly trend analysis

## Troubleshooting

### Problem: Verification fails
**Check**:
1. DNS propagation (wait 48 hours)
2. TXT record format (exact match)
3. Domain ownership (correct account)

### Problem: No data showing
**Check**:
1. Verification status (should be verified)
2. Time frame (data takes 2-3 days)
3. Property type (domain vs URL prefix)

### Problem: Sudden traffic drop
**Check**:
1. Manual actions (penalties)
2. Index coverage (de-indexed pages)
3. Algorithm updates (check news)
4. Technical issues (server, redirects)

## Resources

### Official Documentation:
- [Search Console Help](https://support.google.com/webmasters)
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Webmaster Guidelines](https://developers.google.com/search/docs/crawling-indexing/webmaster-guidelines)

### Tools:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [PageSpeed Insights](https://pagespeed.web.dev/)

### Communities:
- [Google Search Central Blog](https://developers.google.com/search/blog)
- [Webmaster Help Community](https://support.google.com/webmasters/community)

## Next Steps After Setup

1. **Set up Google Analytics 4** and link accounts
2. **Create custom dashboards** for key metrics
3. **Establish reporting schedule** (weekly/monthly)
4. **Train team members** on using GSC
5. **Integrate with SEO workflow**

---

*Last updated: February 16, 2026*  
*For questions: contact@voxreach.io*