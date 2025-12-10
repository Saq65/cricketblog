import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Tag, Share2, ThumbsUp, MessageCircle, Eye, ChevronRight, Loader, ArrowLeft, AlertCircle
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function BlogFull() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ DEBUG: Track what's happening
  const [debugInfo, setDebugInfo] = useState({
    urlParams: id,
    fetchAttempted: false,
    fetchUrl: '',
    responseStatus: null,
    responseData: null
  });

  useEffect(() => {
    let isMounted = true;

    const fetchBlogData = async () => {
      const fetchUrl = `http://localhost:5000/api/v1/blog/${id}`;
      
      // ✅ DEBUG: Log the attempt
      console.log('🔍 Attempting to fetch:', fetchUrl);
      setDebugInfo(prev => ({
        ...prev,
        fetchAttempted: true,
        fetchUrl
      }));

      try {
        setLoading(true);
        setError(null);
        
        const blogResponse = await fetch(fetchUrl);
        
        // ✅ DEBUG: Log the response
        console.log('📡 Response status:', blogResponse.status);
        setDebugInfo(prev => ({
          ...prev,
          responseStatus: blogResponse.status
        }));
        
        if (!blogResponse.ok) {
          const errorData = await blogResponse.json().catch(() => ({}));
          console.error('❌ Error response:', errorData);
          throw new Error(errorData.message || `HTTP ${blogResponse.status}: Blog not found`);
        }
        
        const blogData = await blogResponse.json();
        
        // ✅ DEBUG: Log the data
        console.log('✅ Blog data received:', blogData);
        setDebugInfo(prev => ({
          ...prev,
          responseData: blogData
        }));

        if (!isMounted) return;

        if (blogData.success && blogData.data) {
          setBlog(blogData.data);
          setLikes(blogData.data.likes || 0);

          // Check localStorage for previous like
          const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '[]');
          setHasLiked(likedBlogs.includes(id));

          // Fetch related blogs
          try {
            const relatedUrl = `http://localhost:5000/api/v1/blog/${id}/related?limit=3`;
            console.log('🔍 Fetching related blogs:', relatedUrl);
            
            const relatedResponse = await fetch(relatedUrl);
            
            console.log('📡 Related response status:', relatedResponse.status);
            
            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json();
              
              if (isMounted && relatedData.success && relatedData.data) {
                console.log('✅ Related blogs received:', relatedData.data.length);
                setRelatedBlogs(relatedData.data);
              }
            } else {
              console.warn('⚠️ Related blogs request failed:', relatedResponse.status);
            }
          } catch (relatedErr) {
            console.warn('⚠️ Could not fetch related blogs:', relatedErr);
          }
        } else {
          throw new Error('Blog not found - invalid response structure');
        }
      } catch (err) {
        console.error('💥 Error fetching blog:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load blog');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchBlogData();
    } else {
      setError('No blog ID provided');
      setLoading(false);
      console.error('❌ No blog ID in URL params');
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleLike = async () => {
    if (!id) return;
    
    const previousLikes = likes;
    const previousHasLiked = hasLiked;
    
    setLikes(hasLiked ? likes - 1 : likes + 1);
    setHasLiked(!hasLiked);
    
    try {
      const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '[]');
      if (hasLiked) {
        const updated = likedBlogs.filter(blogId => blogId !== id);
        localStorage.setItem('likedBlogs', JSON.stringify(updated));
      } else {
        likedBlogs.push(id);
        localStorage.setItem('likedBlogs', JSON.stringify(likedBlogs));
      }
    } catch (storageErr) {
      console.warn('localStorage not available:', storageErr);
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/blog/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ increment: !previousHasLiked })
      });

      if (!response.ok) {
        throw new Error('Failed to like blog');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setLikes(data.data.likes);
      }
    } catch (err) {
      console.error('Error liking blog:', err);
      
      setLikes(previousLikes);
      setHasLiked(previousHasLiked);
      
      try {
        const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '[]');
        if (previousHasLiked) {
          likedBlogs.push(id);
          localStorage.setItem('likedBlogs', JSON.stringify(likedBlogs));
        } else {
          const updated = likedBlogs.filter(blogId => blogId !== id);
          localStorage.setItem('likedBlogs', JSON.stringify(updated));
        }
      } catch (storageErr) {
        console.warn('localStorage revert failed:', storageErr);
      }
      
      alert('Failed to like the blog. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!blog) return;
    
    const shareData = {
      title: blog.title,
      text: blog.des || 'Check out this amazing article!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('✅ Link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        
        try {
          const tempInput = document.createElement('input');
          tempInput.value = window.location.href;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          alert('✅ Link copied!');
        } catch (fallbackErr) {
          console.error('All share methods failed:', fallbackErr);
        }
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading blog...</p>
          {/* ✅ DEBUG INFO */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left max-w-md">
            <p className="text-gray-300 text-sm mb-2">🔍 Debug Info:</p>
            <p className="text-gray-400 text-xs">URL Param ID: {debugInfo.urlParams}</p>
            <p className="text-gray-400 text-xs">Fetch URL: {debugInfo.fetchUrl}</p>
            <p className="text-gray-400 text-xs">Status: {debugInfo.responseStatus || 'Pending...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center px-4 max-w-2xl">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-white text-2xl font-bold mb-2">Blog Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The blog you are looking for does not exist.'}</p>
          
          {/* ✅ ENHANCED DEBUG INFO */}
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6 text-left">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-white font-bold">Debug Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <strong>URL Param ID:</strong> <code className="text-yellow-400">{debugInfo.urlParams || 'Not found'}</code>
              </p>
              <p className="text-gray-300">
                <strong>Fetch URL:</strong> <code className="text-yellow-400 break-all">{debugInfo.fetchUrl}</code>
              </p>
              <p className="text-gray-300">
                <strong>HTTP Status:</strong> <code className="text-yellow-400">{debugInfo.responseStatus || 'N/A'}</code>
              </p>
              {debugInfo.responseData && (
                <details className="mt-4">
                  <summary className="text-gray-300 cursor-pointer hover:text-white">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(debugInfo.responseData, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
              <p className="text-yellow-300 text-sm font-semibold mb-2">⚠️ Troubleshooting Steps:</p>
              <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                <li>Check if backend is running: <code className="text-yellow-400">http://localhost:5000</code></li>
                <li>Verify blog exists in database: <code className="text-yellow-400">db.blogcardfuls.findOne()</code></li>
                <li>Test API directly: <code className="text-yellow-400">curl http://localhost:5000/api/v1/blog/{id}</code></li>
                <li>Check backend console for errors</li>
                <li>Verify route order in <code className="text-yellow-400">blogCardFullRoutes.js</code></li>
              </ol>
            </div>
          </div>
          
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Category Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase">
            <Tag className="w-4 h-4" />
            {blog.cat || 'General'}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDate(blog.createdAt)}</span>
          </div>
          {blog.readTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{blog.readTime}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{(blog.views || 0).toLocaleString()} views</span>
          </div>
        </div>

        {blog.image && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-[400px] object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 border border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                hasLiked
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-700'
              }`}
              aria-label={hasLiked ? 'Unlike' : 'Like'}
            >
              <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              <span className="font-semibold">{likes}</span>
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-gray-300 hover:bg-gray-700 transition-all"
              aria-label="Comments"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">{blog.comments || 0}</span>
            </button>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-semibold">Share</span>
          </button>
        </div>

        <article className="bg-gray-800/50 rounded-2xl p-8 md:p-12 mb-12  border-gray-700">
          {blog.content ? (
            <div
              className="prose prose-invert prose-lg max-w-none text-white"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          ) : (
            <p className="text-gray-400">No content available.</p>
          )}
        </article>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-white font-bold text-lg mb-4">Tags</h3>
            <div className="flex flex-wrap gap-3">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-blue-600 hover:text-white transition-all cursor-pointer border border-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedBlogs.length > 0 && (
          <div>
            <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
              Related Articles
              <ChevronRight className="w-6 h-6 text-orange-600" />
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedBlogs.map((related) => (
                <Link
                  key={related._id}
                  to={`/blog/${related._id}`}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-600 transition-all group cursor-pointer block"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {related.cat || 'General'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-white font-bold mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {related.title}
                    </h4>
                    {related.readTime && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{related.readTime}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .prose h2 { color: #ffffff; font-size: 1.875rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; }
        .prose h3 { color: #ffffff; font-size: 1.5rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .prose h4 { color: #ffffff; font-size: 1.25rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .prose p { color: #d1d5db; line-height: 1.8; margin-bottom: 1.25rem; }
        .prose ul, .prose ol { margin-top: 1rem; margin-bottom: 1.5rem; padding-left: 2rem; }
        .prose li { color: #d1d5db; margin-bottom: 0.75rem; padding-left: 0.5rem; }
        .prose ul li { list-style-type: disc; }
        .prose ol li { list-style-type: decimal; }
        .prose strong { color: #ea580c; font-weight: 600; }
        .prose em { color: #a3a3a3; font-style: italic; }
        .prose a { color: #3b82f6; text-decoration: underline; }
        .prose a:hover { color: #60a5fa; }
        .prose blockquote { border-left: 4px solid #2563eb; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #9ca3af; background: rgba(37, 99, 235, 0.1); padding: 1.5rem; border-radius: 0.5rem; }
        .prose code { background: #1a1a1a; padding: 0.2rem 0.4rem; border-radius: 0.25rem; color: #f472b6; font-size: 0.875em; font-family: 'Courier New', monospace; }
        .prose pre { background: #1a1a1a; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1.5rem 0; }
        .prose pre code { background: none; padding: 0; color: #d1d5db; }
        .prose img { border-radius: 0.5rem; margin: 2rem 0; max-width: 100%; height: auto; }
        .prose table { border-collapse: collapse; width: 100%; margin: 2rem 0; }
        .prose th, .prose td { border: 1px solid #374151; padding: 0.75rem; text-align: left; }
        .prose th { background: #1f2937; color: #ffffff; font-weight: 600; }
        .prose td { color: #d1d5db; }
        .prose hr { border: none; border-top: 2px solid #374151; margin: 2rem 0; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}

export default BlogFull;