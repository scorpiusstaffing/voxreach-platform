import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Bookmark, MessageCircle, Menu, X, Phone } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-stone-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-900">Voxreach</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                Home
              </Link>
              <Link to="/features" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                Pricing
              </Link>
              <Link to="/blog" className="text-amber-600 font-medium transition-colors">
                Blog
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
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
            <div className="md:hidden py-4 border-t border-stone-200">
              <div className="flex flex-col gap-4">
                <Link to="/" className="text-stone-600 hover:text-stone-900 font-medium">
                  Home
                </Link>
                <Link to="/features" className="text-stone-600 hover:text-stone-900 font-medium">
                  Features
                </Link>
                <Link to="/pricing" className="text-stone-600 hover:text-stone-900 font-medium">
                  Pricing
                </Link>
                <Link to="/blog" className="text-amber-600 font-medium">
                  Blog
                </Link>
                <Link to="/login" className="text-stone-600 hover:text-stone-900 font-medium">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-stone-200">
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
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight">
            {post.title}
          </h1>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors">
              <Bookmark className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <article className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-stone-200">
          <div 
            className="blog-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 md:p-12 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Automate Your Customer Conversations
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            Ready to implement AI voice agents in your business? Voxreach makes it easy to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/pricing"
              className="px-8 py-3 bg-white text-amber-600 font-semibold rounded-lg hover:bg-stone-100 transition-colors text-center"
            >
              View Pricing Plans
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors border border-amber-600 text-center"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* Comments/Feedback */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-stone-600" />
            <h3 className="text-xl font-bold text-stone-900">Have thoughts on this article?</h3>
          </div>
          <p className="text-stone-600 mb-6">
            We'd love to hear your feedback or answer any questions about AI voice technology.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors"
          >
            Contact Our Team
          </Link>
        </div>
      </div>

      {/* Sticky Bottom CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 md:hidden z-40">
        <div className="flex gap-3">
          <Link
            to="/pricing"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg text-center text-sm"
          >
            View Pricing
          </Link>
          <Link
            to="/signup"
            className="flex-1 px-4 py-2 bg-stone-900 text-white font-semibold rounded-lg text-center text-sm"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}