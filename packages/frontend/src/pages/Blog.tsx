import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, BookOpen, Menu, X } from 'lucide-react';
import { api } from '../lib/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  excerpt: string;
  author?: string;
  readTime?: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blog/posts');
      if (response.success) {
        setPosts(response.posts);
      } else {
        setError('Failed to load blog posts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden">
      {/* Soft Gradient Orbs for Luxury Feel */}
      <div className="gradient-orb-light w-[800px] h-[800px] -top-96 -right-64" />
      <div className="gradient-orb-light w-[600px] h-[600px] bottom-0 -left-48" style={{ animationDelay: '-6s' }} />
      <div className="gradient-orb-light w-[400px] h-[400px] top-1/3 right-1/4" style={{ animationDelay: '-3s' }} />
      
      {/* Top Navigation Bar - Matching Landing/Pricing */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-stone-200/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Using actual logo.svg */}
            <Link to="/" className="flex items-center">
              <img src="/assets/logo.svg" alt="Voxreach" className="h-10 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="nav-link-premium">
                Home
              </Link>
              <Link to="/pricing" className="nav-link-premium">
                Pricing
              </Link>
              <Link to="/blog" className="nav-link-premium text-stone-900">
                Blog
              </Link>
              <Link to="/login" className="nav-link-premium">
                Log in
              </Link>
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/signup"
                className="btn-premium text-sm py-2 px-6"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-stone-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-stone-200 bg-white/95 backdrop-blur-md">
              <div className="flex flex-col gap-4">
                <Link to="/" className="nav-link-premium">
                  Home
                </Link>
                <Link to="/pricing" className="nav-link-premium">
                  Pricing
                </Link>
                <Link to="/blog" className="nav-link-premium text-stone-900">
                  Blog
                </Link>
                <Link to="/login" className="nav-link-premium">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-premium text-sm py-2 px-6 text-center mt-2"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Voxreach Blog
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-stone-900 mb-6 tracking-tight glow-amber">
              AI Voice Insights &<br />
              <span className="text-gradient">Industry Trends</span>
            </h1>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
              Expert articles on voice AI, customer engagement, and business automation. 
              Learn how leading companies are transforming with AI voice agents.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-stone-600">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchPosts}
              className="btn-premium mt-4"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600">No articles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article 
                key={post.id}
                className="premium-card-hover overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{(() => {
                        const dateStr = post.date || post.publishedAt;
                        if (!dateStr) return 'No date';
                        try {
                          const date = new Date(dateStr);
                          if (isNaN(date.getTime())) return 'Invalid Date';
                          return date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        } catch {
                          return 'Invalid Date';
                        }
                      })()}</span>
                    </div>
                    {post.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-stone-900 mb-3 line-clamp-2 tracking-tight">
                    {post.title}
                  </h2>
                  
                  <p className="text-stone-600 mb-6 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium group"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA Section - Premium Style */}
        <div className="mt-16">
          <div className="premium-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-semibold text-stone-900 mb-4 tracking-tight">
                Ready to Transform Your Business<br />
                <span className="text-gradient">with AI Voice?</span>
              </h2>
              <p className="text-stone-600 text-lg mb-8 max-w-2xl mx-auto">
                See how Voxreach can automate your customer conversations and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/pricing"
                  className="btn-premium"
                >
                  View Pricing
                </Link>
                <Link
                  to="/signup"
                  className="btn-secondary-premium"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Matching Landing page */}
      <footer className="border-t border-stone-200 py-10 text-center text-sm text-stone-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          © 2026 Voxreach. All rights reserved.
        </div>
      </footer>
    </div>
  );
}