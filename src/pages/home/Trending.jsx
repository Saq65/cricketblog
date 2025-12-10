import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

function Trending() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const trendingNews = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop',
      title: 'Historic Century Breaks 20-Year-Old Record',
      description: 'Batsman scores fastest international century in tournament history.',
      tag: '#IPL2025',
      time: '2h ago'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=600&h=400&fit=crop',
      title: 'Shocking Upset: Underdogs Defeat Champions',
      description: 'Tournament favorites stunned by determined underdogs in thrilling finale.',
      tag: '#WorldCup',
      time: '4h ago'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=400&fit=crop',
      title: 'Star Player Announces Retirement from Format',
      description: 'Cricket legend bids farewell after illustrious career spanning 15 years.',
      tag: '#Breaking',
      time: '6h ago'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1512719994953-eabf50895df7?w=600&h=400&fit=crop',
      title: 'Record-Breaking Partnership Stuns Cricket World',
      description: 'Duo creates history with highest partnership in tournament.',
      tag: '#T20',
      time: '8h ago'
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=600&h=400&fit=crop',
      title: 'Controversial Decision Sparks Debate Among Fans',
      description: 'Umpiring call becomes talking point across social media platforms.',
      tag: '#TeamIndia',
      time: '12h ago'
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1611329532992-0b2e9b5a6e66?w=600&h=400&fit=crop',
      title: 'Young Sensation Takes Five-Wicket Haul on Debut',
      description: 'Rising star announces arrival with spectacular bowling performance.',
      tag: '#Rising',
      time: '1d ago'
    }
  ];

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
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => 
        prev + cardsToShow >= trendingNews.length ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlay, cardsToShow, trendingNews.length]);

  const nextSlide = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => 
      prev + cardsToShow >= trendingNews.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, trendingNews.length - cardsToShow) : prev - 1
    );
  };

  return (
    <section className="py-16 px-4 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-red-600 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-4xl font-bold flex items-center gap-2">
              🔥 Trending Now
            </h2>
            <p className="text-gray-400 mt-1">Latest buzz in the cricket world</p>
          </div>
        </div>

        {/* Carousel Container */}
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
            disabled={currentIndex + cardsToShow >= trendingNews.length}
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
              {trendingNews.map((news) => (
                <div
                  key={news.id}
                  className="px-4 flex-shrink-0"
                  style={{ width: `${100 / cardsToShow}%` }}
                >
                  <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:shadow-red-600/20 transition-all duration-300 group hover:scale-105 cursor-pointer">
                    {/* Image Container */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                      
                      {/* Tag and Time */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          {news.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        {news.time}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                        {news.description}
                      </p>
                      
                      {/* Read More Link */}
                      <div className="flex items-center gap-2 text-red-500 font-semibold text-sm group-hover:gap-3 transition-all">
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
            {Array.from({ length: Math.ceil(trendingNews.length / cardsToShow) }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlay(false);
                  setCurrentIndex(index * cardsToShow);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  Math.floor(currentIndex / cardsToShow) === index
                    ? 'w-8 bg-red-600'
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Trending;