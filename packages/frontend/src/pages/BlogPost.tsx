import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, Tag, Share2, Bookmark } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  metaDescription: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        const response = await fetch(`/api/blog/posts/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
          
          // Fetch related posts
          const relatedResponse = await fetch('/api/blog/posts');
          if (relatedResponse.ok) {
            const allPosts = await relatedResponse.json();
            // Filter out current post and get 2 related posts
            const filtered = allPosts
              .filter((p: BlogPost) => p.slug !== slug)
              .slice(0, 2);
            setRelatedPosts(filtered);
          }
        } else {
          console.error('Failed to fetch blog post');
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-stone-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">Article Not Found</h1>
          <p className="text-stone-600 mb-8">The article you're looking for doesn't exist.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Article Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-12 px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-amber-100 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {post.tags.map((tag) => (
              <span 
                key={tag}
                className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-amber-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{post.publishedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-stone-200">
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mb-8 pb-8 border-b border-stone-100">
            <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
              <Bookmark className="w-5 h-5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          {/* Article Body */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Author Bio */}
          <div className="mt-12 pt-8 border-t border-stone-200">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                V
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">{post.author}</h3>
                <p className="text-stone-600 mt-2">
                  The VoxReach team consists of AI specialists, sales experts, and business consultants dedicated to helping companies implement voice AI solutions that drive real results.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-xl p-6 border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Calendar className="w-4 h-4" />
                      <span>{relatedPost.publishedAt}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Clock className="w-4 h-4" />
                      <span>{relatedPost.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-3 line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedPost.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Implement AI Voice Agents?</h3>
          <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
            Start automating your phone calls today with VoxReach. Get your first agent running in under 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-amber-600 font-semibold px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              to="/pricing"
              className="bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}