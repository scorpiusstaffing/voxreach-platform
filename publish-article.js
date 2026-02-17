#!/usr/bin/env node

/**
 * VoxReach Article Publisher
 * 
 * This script publishes SEO articles to voxreach.io/blog via API
 * It reads articles from seo-articles/ directory and publishes them
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const ARTICLES_DIR = path.join(__dirname, 'seo-articles');
const API_URL = process.env.VOXREACH_API_URL || 'http://localhost:3001/api/blog/posts';

async function publishArticle(filePath) {
  try {
    console.log(`📝 Publishing article: ${path.basename(filePath)}`);
    
    // Read and parse markdown file
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // Prepare article data
    const articleData = {
      title: frontmatter.title || path.basename(filePath, '.md').replace(/\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '),
      content: markdownContent,
      author: frontmatter.author || 'VoxReach Team',
      tags: frontmatter.tags || ['AI Voice Agents', 'Business'],
      metaTitle: frontmatter.metaTitle,
      metaDescription: frontmatter.metaDescription
    };

    console.log(`📄 Article: ${articleData.title}`);
    console.log(`📊 Word count: ${markdownContent.split(/\s+/).length}`);
    console.log(`🏷️  Tags: ${articleData.tags.join(', ')}`);

    // Publish via API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Published successfully: ${result.slug}`);
      console.log(`📁 File: ${result.filename}`);
      return { success: true, result };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to publish: ${response.status} ${response.statusText}`);
      console.error(`📝 Error: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.error(`❌ Error publishing article:`, error.message);
    return { success: false, error: error.message };
  }
}

async function publishAllArticles() {
  try {
    console.log('🚀 Starting VoxReach article publishing...');
    console.log(`📁 Articles directory: ${ARTICLES_DIR}`);
    console.log(`🌐 API endpoint: ${API_URL}`);
    console.log('─'.repeat(50));

    // Read all markdown files
    const files = await fs.readdir(ARTICLES_DIR);
    const markdownFiles = files.filter(f => f.endsWith('.md'));
    
    console.log(`📚 Found ${markdownFiles.length} articles to publish`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Publish each article
    for (const file of markdownFiles) {
      const filePath = path.join(ARTICLES_DIR, file);
      const result = await publishArticle(filePath);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      console.log('─'.repeat(50));
    }
    
    // Summary
    console.log('📊 PUBLISHING SUMMARY:');
    console.log(`✅ Successfully published: ${successCount} articles`);
    console.log(`❌ Failed to publish: ${errorCount} articles`);
    console.log(`📈 Total processed: ${markdownFiles.length} articles`);
    
    if (errorCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  publishAllArticles();
}

module.exports = { publishArticle, publishAllArticles };