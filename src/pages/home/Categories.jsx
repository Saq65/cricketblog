import { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, Loader, AlertCircle, TrendingUp } from 'lucide-react';
import colors from '../../styles/colour';
import { useNavigate } from 'react-router-dom';

function Categories() {
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  const [debugInfo, setDebugInfo] = useState({
    blogsEndpoint: '',
    blogsStatus: null,
    blogsCount: 0,
    categoriesFound: []
  });

  const navigate = useNavigate();

  // Responsive cards per view
  const cardsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  const [cardsToShow, setCardsToShow] = useState(3);

  useEffect(() => {
    const updateCardsToShow = () => {
      if (window.innerWidth < 768) {
        setCardsToShow(cardsPerView.mobile);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(cardsPerView.tablet);
      } else {
        setCardsToShow(cardsPerView.desktop);
      }
    };

    updateCardsToShow();
    window.addEventListener('resize', updateCardsToShow);
    return () => window.removeEventListener('resize', updateCardsToShow);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const blogsEndpoint = 'http://localhost:5000/api/v1/blog';
        console.log('🔍 Fetching blogs from:', blogsEndpoint);
        
        setDebugInfo(prev => ({ ...prev, blogsEndpoint }));

        const blogResponse = await fetch(blogsEndpoint);
        
        console.log('📡 Response status:', blogResponse.status);
        setDebugInfo(prev => ({ ...prev, blogsStatus: blogResponse.status }));
        
        if (!blogResponse.ok) {
          throw new Error(`Failed to fetch blogs: HTTP ${blogResponse.status}`);
        }

        const blogData = await blogResponse.json();
        console.log('✅ Blog data received:', blogData);

        if (blogData.success && blogData.data) {
          setBlogs(blogData.data);
          
          const uniqueCategories = ['all', ...new Set(
            blogData.data
              .map(blog => blog.cat)
              .filter(Boolean)
          )];
          
          setCategories(uniqueCategories);
          console.log('📂 Categories found:', uniqueCategories);
          
          setDebugInfo(prev => ({
            ...prev,
            blogsCount: blogData.data.length,
            categoriesFound: uniqueCategories
          }));

          if (uniqueCategories.length > 0) {
            setActiveTab(uniqueCategories[0]);
          }
        } else {
          throw new Error('Invalid response format from API');
        }

        setLoading(false);
      } catch (err) {
        console.error('💥 Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBlogs = activeTab === 'all' 
    ? blogs 
    : blogs.filter(blog => blog.cat === activeTab);

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlay || filteredBlogs.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => 
        prev + cardsToShow >= filteredBlogs.length ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlay, cardsToShow, filteredBlogs.length]);

  // Reset current index when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsAutoPlay(true);
  }, [activeTab]);

  const nextSlide = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => 
      prev + cardsToShow >= filteredBlogs.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, filteredBlogs.length - cardsToShow) : prev - 1
    );
  };

  console.log('📊 Filtered blogs count:', filteredBlogs.length);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading categories...</p>
          <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left max-w-md mx-auto border border-gray-700">
            <p className="text-gray-300 text-sm mb-2">🔍 Debug Info:</p>
            <p className="text-gray-400 text-xs">Endpoint: {debugInfo.blogsEndpoint}</p>
            <p className="text-gray-400 text-xs">Status: {debugInfo.blogsStatus || 'Pending...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center px-4 max-w-2xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Blogs</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-bold text-white mb-4">🔍 Debug Information:</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300"><strong>Endpoint:</strong> <code className="text-red-400">{debugInfo.blogsEndpoint}</code></p>
              <p className="text-gray-300"><strong>Status:</strong> <code className="text-red-400">{debugInfo.blogsStatus}</code></p>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded">
              <p className="font-semibold text-white mb-2">⚠️ Troubleshooting:</p>
              <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                <li>Is backend running on <code>http://localhost:5000</code>?</li>
                <li>Is MongoDB connected?</li>
                <li>Check if blogs exist in <code>blogcardfuls</code> collection</li>
                <li>Verify route: <code>app.use('/api/v1/blog', blogroutesfull)</code></li>
                <li>Test API: <code>curl http://localhost:5000/api/v1/blog</code></li>
              </ol>
            </div>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
       
          <div>
            <h2 className="text-4xl font-bold flex items-center gap-2">
              Top Categories
            </h2>
            <p className="text-gray-400 mt-1">Explore our latest blog posts</p>
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-12 border-b border-gray-700 pb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 capitalize ${
                  activeTab === category
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-6 mb-12">
            <p className="text-yellow-400">
              ⚠️ No categories found. Add some blogs to see categories here.
            </p>
          </div>
        )}

        {/* Carousel Container */}
        {filteredBlogs.length > 0 ? (
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white text-gray-900 p-3 rounded-full shadow-xl hover:bg-gray-100 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white text-gray-900 p-3 rounded-full shadow-xl hover:bg-gray-100 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentIndex + cardsToShow >= filteredBlogs.length}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Cards Wrapper */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)`
                }}
              >
                {filteredBlogs.map((blog) => (
                  <div
                    key={blog._id}
                    className="px-4 flex-shrink-0"
                    style={{ width: `${100 / cardsToShow}%` }}
                  >
                    <div 
                      className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:shadow-blue-600/20 transition-all duration-300 group hover:scale-105 cursor-pointer"
                      onClick={() => navigate(`/blog/${blog._id}`)}
                    >
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                        
                        {/* Tag */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg capitalize">
                            {blog.cat}
                          </span>
                        </div>

                        {/* Meta Info */}
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          {blog.views !== undefined && (
                            <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              👁️ {blog.views.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                          {blog.des}
                        </p>
                        
                        {/* Read Time */}
                        {blog.readTime && (
                          <div className="text-gray-500 text-sm mb-4">
                            📖 {blog.readTime}
                          </div>
                        )}
                        
                        {/* Read More Link */}
                        <div 
                          className="flex items-center gap-2 text-blue-500 font-semibold text-sm group-hover:gap-3 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/blog/${blog._id}`);
                          }}
                        >
                          <span>Read Full Story</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: Math.ceil(filteredBlogs.length / cardsToShow) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlay(false);
                    setCurrentIndex(index * cardsToShow);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    Math.floor(currentIndex / cardsToShow) === index
                      ? 'w-8 bg-blue-600'
                      : 'w-2 bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">
              No blog posts available{activeTab !== 'all' ? ` for "${activeTab}" category` : ''} yet.
            </p>
            {blogs.length > 0 && (
              <p className="text-gray-500 text-sm mt-2">
                Total blogs in database: {blogs.length}
              </p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}

export default Categories;