import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const router = Router();

// Path to SEO articles
const ARTICLES_DIR = path.join(__dirname, '../../seo-articles');

// Helper to calculate read time
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

// Ensure articles directory exists
async function ensureArticlesDir() {
  try {
    await fs.mkdir(ARTICLES_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating articles directory:', err);
  }
}

// Get all blog posts
router.get('/posts', async (req, res) => {
  try {
    await ensureArticlesDir();
    const files = await fs.readdir(ARTICLES_DIR);
    const posts = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      try {
        const filePath = path.join(ARTICLES_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontmatter, content: markdownContent } = matter(content);
        
        // Extract slug from filename (YYYY-MM-DD-slug.md)
        const slugMatch = file.match(/\d{4}-\d{2}-\d{2}-(.+)\.md/);
        const slug = slugMatch ? slugMatch[1] : file.replace('.md', '');

        // Create excerpt from first 200 characters
        const excerpt = frontmatter.excerpt || 
          markdownContent.replace(/[#*`]/g, '').substring(0, 200).trim() + '...';

        posts.push({
          id: slug,
          slug,
          title: frontmatter.title || slug.replace(/-/g, ' '),
          excerpt,
          content: markdownContent,
          author: frontmatter.author || 'VoxReach Team',
          publishedAt: frontmatter.date || file.substring(0, 10),
          readTime: calculateReadTime(markdownContent),
          tags: frontmatter.tags || ['AI Voice Agents', 'Business'],
          metaTitle: frontmatter.metaTitle,
          metaDescription: frontmatter.metaDescription
        });
      } catch (error) {
        console.error(`Error reading article ${file}:`, error);
      }
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    await ensureArticlesDir();
    const { slug } = req.params;
    // Find the file with this slug
    const files = await fs.readdir(ARTICLES_DIR);
    const file = files.find(f => f.includes(slug) && f.endsWith('.md'));
    if (!file) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const filePath = path.join(ARTICLES_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);

    const post = {
      id: slug,
      slug,
      title: frontmatter.title || slug.replace(/-/g, ' '),
      excerpt: frontmatter.excerpt || markdownContent.substring(0, 200) + '...',
      content: markdownContent,
      author: frontmatter.author || 'VoxReach Team',
      publishedAt: frontmatter.date || file.substring(0, 10),
      readTime: calculateReadTime(markdownContent),
      tags: frontmatter.tags || ['AI Voice Agents', 'Business'],
      metaTitle: frontmatter.metaTitle,
      metaDescription: frontmatter.metaDescription
    };

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blog post' });
  }
});

// Publish new article (for cron job)
router.post('/publish', async (req, res) => {
  try {
    const { title, content, author = 'VoxReach Team', tags = [], metaTitle, metaDescription } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    await ensureArticlesDir();

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${date}-${slug}.md`;
    const filePath = path.join(ARTICLES_DIR, filename);

    // Create frontmatter
    const frontmatter = {
      title,
      date,
      author,
      tags,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.substring(0, 155) + '...'
    };

    // Write markdown file with frontmatter
    const markdownContent = `---\n${Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? `[${value.map(v => `"${v}"`).join(', ')}]` : `"${value}"`}`)
      .join('\n')}\n---\n\n${content}`;

    await fs.writeFile(filePath, markdownContent, 'utf-8');

    res.json({
      success: true,
      message: 'Blog post created',
      slug,
      filename,
      filePath
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'blog-api',
    articlesDir: ARTICLES_DIR
  });
});

export default router;