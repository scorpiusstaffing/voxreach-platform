import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

const router = Router();

// Directory for SEO articles
const ARTICLES_DIR = path.join(__dirname, '../../seo-articles');

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
      if (file.endsWith('.md')) {
        const filePath = path.join(ARTICLES_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        
        // Extract title (first line without #)
        const title = lines[0].replace(/^#\s*/, '').trim();
        const slug = file.replace('.md', '');
        
        // Extract excerpt (next 2-3 lines)
        let excerpt = '';
        for (let i = 1; i < Math.min(4, lines.length); i++) {
          if (lines[i].trim()) {
            excerpt += lines[i].trim() + ' ';
          }
        }
        excerpt = excerpt.trim().substring(0, 150);
        if (excerpt.length === 150) excerpt += '...';

        posts.push({
          id: slug,
          slug,
          title,
          date: new Date().toISOString().split('T')[0], // Use file modification date in production
          excerpt,
          author: 'Voxreach Team'
        });
      }
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post
router.get('/posts/:slug', async (req, res) => {
  try {
    const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
    const content = await fs.readFile(filePath, 'utf-8');
    const html = marked.parse(content);

    const lines = content.split('\n');
    const title = lines[0].replace(/^#\s*/, '').trim();

    // Calculate read time (approx 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    res.json({
      success: true,
      post: {
        id: req.params.slug,
        slug: req.params.slug,
        title,
        date: new Date().toISOString().split('T')[0],
        content: html,
        author: 'Voxreach Team',
        readTime: `${readTime} min read`
      }
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(404).json({ success: false, error: 'Blog post not found' });
  }
});

// Publish new article (for cron job)
router.post('/publish', async (req, res) => {
  try {
    const { title, content, slug } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and content are required' 
      });
    }

    await ensureArticlesDir();

    // Generate slug from title if not provided
    const articleSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const filePath = path.join(ARTICLES_DIR, `${articleSlug}.md`);
    const markdownContent = `# ${title}\n\n${content}`;

    await fs.writeFile(filePath, markdownContent, 'utf-8');

    console.log(`SEO article published: ${articleSlug}`);
    res.json({ 
      success: true, 
      slug: articleSlug,
      message: 'Article published successfully' 
    });
  } catch (error) {
    console.error('Error publishing article:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to publish article' 
    });
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