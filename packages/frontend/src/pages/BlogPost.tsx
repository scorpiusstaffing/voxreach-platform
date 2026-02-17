import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Bookmark, MessageCircle, Menu, X } from 'lucide-react';
import { api } from '../lib/api';
import '../styles/blog.css';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  content: string;
  author?: string;
  readTime?: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/blog/posts/${postSlug}`);
      if (response.success) {
        setPost(response.post);
      } else {
        setError('Failed to load blog post');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-stone-600">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-pattern relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Article not found'}</p>
            <Link
              to="/blog"
              className="mt-4 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden">
      {/* Soft Gradient Orbs for Luxury Feel */}
      <div className="gradient-orb-light w-[800px] h-[800px] -top-96 -right-64" />
      <div className="gradient-orb-light w-[600px] h-[600px] bottom-0 -left-48" style={{ animationDelay: '-6s' }} />
      
      {/* Top Navigation Bar - Matching Landing/Pricing */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-stone-200/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Using actual logo.svg like Landing page */}
            <Link to="/" className="flex items-center">
              <img src="/assets/logo.svg" alt="Voxreach" className="h-10 w-auto" />
            </Link>

            {/* Desktop Navigation - Matching Landing page styling */}
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

            {/* CTA Button - Premium styling */}
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

      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors nav-link-premium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header - Premium Card Style */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="premium-card p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-6">
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
            {post.readTime && (
              <div className="flex items-center gap-1">
                <span>•</span>
                <span>{post.readTime} read</span>
              </div>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-stone-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary-premium text-sm py-2 px-4">
              <Share2 className="w-4 h-4 mr-2 inline" />
              Share
            </button>
            <button className="btn-secondary-premium text-sm py-2 px-4">
              <Bookmark className="w-4 h-4 mr-2 inline" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Article Content - Premium Card Style */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <article className="premium-card p-8 md:p-12">
          <div 
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* CTA Section - Premium Gradient Style */}
        <div className="mt-12 premium-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 mb-4 tracking-tight">
              Automate Your Customer Conversations
            </h2>
            <p className="text-stone-600 text-lg mb-8">
              Ready to implement AI voice agents in your business? Voxreach makes it easy to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/pricing"
                className="btn-premium"
              >
                View Pricing Plans
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

        {/* Comments/Feedback - Premium Card Style */}
        <div className="mt-12 premium-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-stone-600" />
            <h3 className="text-xl font-semibold text-stone-900 tracking-tight">Have thoughts on this article?</h3>
          </div>
          <p className="text-stone-600 mb-6">
            We'd love to hear your feedback or answer any questions about AI voice technology.
          </p>
          <Link
            to="/contact"
            className="btn-secondary-premium inline-flex"
          >
            Contact Our Team
          </Link>
        </div>
      </div>

      {/* Footer - Matching Landing page */}
      <footer className="border-t border-stone-200 py-10 text-center text-sm text-stone-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          © 2026 Voxreach. All rights reserved.
        </div>
      </footer>

      {/* Spacer for mobile bottom bar */}
      <div className="h-8"></div>
    </div>
  );
}