import { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Search, Tag, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  featuredImage?: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog/posts');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          console.error('Failed to fetch blog posts');
          // Fallback to existing SEO articles
          const fallbackPosts = await loadFallbackPosts();
          setPosts(fallbackPosts);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        // Fallback to existing SEO articles
        const fallbackPosts = await loadFallbackPosts();
        setPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Load fallback posts from existing SEO articles
  const loadFallbackPosts = async (): Promise<BlogPost[]> => {
    try {
      // This would fetch from local files or API
      // For now, return empty array - real articles will be loaded by API
      return [];
    } catch (error) {
      console.error('Error loading fallback posts:', error);
      return [];
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-20 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            VoxReach Blog
          </h1>
          <p className="text-xl text-amber-100 max-w-3xl mx-auto mb-10">
            Expert insights on AI voice agents, sales automation, and business growth. 
            Practical guides for business owners and sales leaders.
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles about AI voice agents, sales automation, business setup..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-amber-100 focus:outline-none focus:ring-2 focus:ring-white/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            <p className="mt-4 text-stone-600">Loading articles...</p>
          </div>
        ) : (
          <>
            {/* Featured Posts */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-8">Latest Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article 
                    key={post.id}
                    className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {post.featuredImage && (
                      <div className="h-48 bg-gradient-to-r from-amber-100 to-amber-200"></div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Calendar className="w-4 h-4" />
                          <span>{post.publishedAt}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-stone-900 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-stone-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-stone-400" />
                          <span className="text-sm text-stone-600">{post.author}</span>
                        </div>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium group"
                        >
                          Read Article
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-8">Browse by Topic</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'AI Setup Guides', count: 12, color: 'bg-blue-50 text-blue-700' },
                  { name: 'Sales Automation', count: 8, color: 'bg-green-50 text-green-700' },
                  { name: 'Business ROI', count: 6, color: 'bg-purple-50 text-purple-700' },
                  { name: 'Industry Use Cases', count: 10, color: 'bg-amber-50 text-amber-700' },
                ].map((category) => (
                  <button
                    key={category.name}
                    className={`${category.color} rounded-xl p-6 text-left hover:opacity-90 transition-opacity`}
                    onClick={() => setSearchQuery(category.name.split(' ')[0])}
                  >
                    <h3 className="font-bold text-lg mb-2">{category.name}</h3>
                    <p className="text-sm opacity-75">{category.count} articles</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 md:p-12 text-white">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold mb-4">Get AI Voice Agent Insights</h3>
                <p className="text-amber-100 mb-8">
                  Join 2,000+ business owners getting weekly tips on AI automation, sales growth, and voice technology.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Your business email"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-amber-100 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <button className="bg-white text-amber-600 font-semibold px-6 py-3 rounded-lg hover:bg-amber-50 transition-colors">
                    Subscribe
                  </button>
                </div>
                <p className="text-sm text-amber-200 mt-4">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}