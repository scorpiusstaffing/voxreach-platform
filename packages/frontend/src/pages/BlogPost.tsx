import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Bookmark, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  content: string;
  author?: string;
  readTime?: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/blog/posts/${postSlug}`);
      // API returns { success: true, post: {...} } directly (not axios response)
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
      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-stone-200">
          <div className="flex items-center gap-4 text-sm text-stone-500 mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
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
          
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">
            {post.title}
          </h1>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
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
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-stone-200">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-strong:text-stone-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 md:p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-white mb-4">
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
    </div>
  );
}