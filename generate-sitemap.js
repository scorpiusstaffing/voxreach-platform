#!/usr/bin/env node

/**
 * VoxReach Sitemap Generator
 * Generates XML sitemaps for SEO optimization
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://voxreach.io';
const SITE_PAGES = [
  // Static pages
  { url: '/', priority: 1.0, changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
  { url: '/ai-voice-agent', priority: 0.9, changefreq: 'weekly', lastmod: '2026-02-16' },
  { url: '/ai-call-software', priority: 0.9, changefreq: 'weekly', lastmod: '2026-02-16' },
  { url: '/automated-calling', priority: 0.9, changefreq: 'weekly', lastmod: '2026-02-16' },
  { url: '/voice-agents-pricing', priority: 0.8, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/features', priority: 0.8, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/use-cases', priority: 0.8, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/pricing', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/login', priority: 0.5, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/signup', priority: 0.5, changefreq: 'monthly', lastmod: '2026-02-16' },
  
  // Blog categories
  { url: '/blog', priority: 0.8, changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
  { url: '/blog/ai-voice-agents', priority: 0.7, changefreq: 'weekly', lastmod: '2026-02-16' },
  { url: '/blog/sales-automation', priority: 0.7, changefreq: 'weekly', lastmod: '2026-02-16' },
  { url: '/blog/customer-service', priority: 0.7, changefreq: 'weekly', lastmod: '2026-02-16' },
  { url: '/blog/technology', priority: 0.7, changefreq: 'weekly', lastmod: '2026-02-16' },
  
  // Documentation
  { url: '/docs', priority: 0.6, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/docs/getting-started', priority: 0.6, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/docs/api', priority: 0.6, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/docs/integrations', priority: 0.6, changefreq: 'monthly', lastmod: '2026-02-16' },
  
  // Legal
  { url: '/privacy', priority: 0.3, changefreq: 'yearly', lastmod: '2026-02-16' },
  { url: '/terms', priority: 0.3, changefreq: 'yearly', lastmod: '2026-02-16' },
  { url: '/cookies', priority: 0.3, changefreq: 'yearly', lastmod: '2026-02-16' },
];

// Blog posts (would be dynamically generated in production)
const BLOG_POSTS = [
  { url: '/blog/what-is-ai-voice-agent', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/blog/ai-calling-software-comparison', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/blog/how-to-automate-sales-calls', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/blog/ai-customer-service-best-practices', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/blog/voice-agent-pricing-guide', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
];

// Use cases
const USE_CASES = [
  { url: '/use-cases/sales-outreach', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/use-cases/appointment-setting', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/use-cases/customer-support', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/use-cases/lead-qualification', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
  { url: '/use-cases/recruitment-calls', priority: 0.7, changefreq: 'monthly', lastmod: '2026-02-16' },
];

// Combine all pages
const ALL_PAGES = [...SITE_PAGES, ...BLOG_POSTS, ...USE_CASES];

function generateSitemap(pages) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;

  pages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    if (page.lastmod) {
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    }
    if (page.changefreq) {
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    }
    if (page.priority) {
      xml += `    <priority>${page.priority}</priority>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

function generateSitemapIndex() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n`;

  // Main sitemap
  xml += `  <sitemap>\n`;
  xml += `    <loc>${BASE_URL}/sitemap.xml</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  // Blog sitemap (would be separate in production)
  xml += `  <sitemap>\n`;
  xml += `    <loc>${BASE_URL}/sitemap-blog.xml</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  // Documentation sitemap
  xml += `  <sitemap>\n`;
  xml += `    <loc>${BASE_URL}/sitemap-docs.xml</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  xml += `</sitemapindex>`;
  return xml;
}

function main() {
  const frontendPublicDir = path.join(__dirname, 'packages/frontend/public');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(frontendPublicDir)) {
    fs.mkdirSync(frontendPublicDir, { recursive: true });
  }

  // Generate main sitemap
  const sitemap = generateSitemap(ALL_PAGES);
  fs.writeFileSync(path.join(frontendPublicDir, 'sitemap.xml'), sitemap);
  console.log('✅ Generated sitemap.xml');

  // Generate sitemap index
  const sitemapIndex = generateSitemapIndex();
  fs.writeFileSync(path.join(frontendPublicDir, 'sitemap-index.xml'), sitemapIndex);
  console.log('✅ Generated sitemap-index.xml');

  // Generate blog sitemap (example)
  const blogSitemap = generateSitemap(BLOG_POSTS);
  fs.writeFileSync(path.join(frontendPublicDir, 'sitemap-blog.xml'), blogSitemap);
  console.log('✅ Generated sitemap-blog.xml');

  // Generate docs sitemap (example)
  const docsPages = ALL_PAGES.filter(p => p.url.startsWith('/docs'));
  const docsSitemap = generateSitemap(docsPages);
  fs.writeFileSync(path.join(frontendPublicDir, 'sitemap-docs.xml'), docsSitemap);
  console.log('✅ Generated sitemap-docs.xml');

  // Update robots.txt with sitemap references
  const robotsPath = path.join(frontendPublicDir, 'robots.txt');
  let robotsContent = '';
  
  if (fs.existsSync(robotsPath)) {
    robotsContent = fs.readFileSync(robotsPath, 'utf8');
  }
  
  // Ensure sitemap references are in robots.txt
  if (!robotsContent.includes('Sitemap:')) {
    robotsContent += '\n\n# Sitemaps\n';
    robotsContent += 'Sitemap: https://voxreach.io/sitemap.xml\n';
    robotsContent += 'Sitemap: https://voxreach.io/sitemap-index.xml\n';
    fs.writeFileSync(robotsPath, robotsContent);
    console.log('✅ Updated robots.txt with sitemap references');
  }

  console.log('\n🎯 Sitemap generation complete!');
  console.log(`📊 Total pages in sitemap: ${ALL_PAGES.length}`);
  console.log(`🌐 Sitemap URL: ${BASE_URL}/sitemap.xml`);
  console.log(`🔗 Submit to Google: https://search.google.com/search-console`);
  console.log(`🔗 Submit to Bing: https://www.bing.com/webmasters`);
}

if (require.main === module) {
  main();
}

module.exports = { generateSitemap, generateSitemapIndex };