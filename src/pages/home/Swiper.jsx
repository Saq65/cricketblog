import { useState, useEffect } from 'react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

function Swiper() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      id: 1,
      title: "THREE UNBREAKABLE RECORDS OF AB DE VILLIERS IN WORLD CRICKET",
      image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&h=600&fit=crop",
      category: "Records"
    },
    {
      id: 2,
      title: "INDIA'S HISTORIC WIN AGAINST AUSTRALIA IN GABBA FORTRESS",
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&h=600&fit=crop",
      category: "Match Highlights"
    },
    {
      id: 3,
      title: "TOP 10 FASTEST CENTURIES IN T20 INTERNATIONAL CRICKET",
      image: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=1200&h=600&fit=crop",
      category: "Statistics"
    },
    {
      id: 4,
      title: "VIRAT KOHLI BREAKS SACHIN'S RECORD WITH 50TH ODI CENTURY",
      image: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=1200&h=600&fit=crop",
      category: "Breaking News"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); 

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full h-full relative">
            {/* Background Image with Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${slide.image})`,
                filter: 'brightness(0.4)'
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/50 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
                <div className="max-w-2xl">
                  {/* Category Badge */}
                  <span className="inline-block bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                    {slide.category}
                  </span>
                  
                  {/* Title */}
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                    {slide.title}
                  </h1>
                  
                  {/* Read More Button */}
                  <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded transition-colors duration-300">
                    READ MORE
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-10"
        aria-label="Previous slide"
      >
        <BsChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-10"
        aria-label="Next slide"
      >
        <BsChevronRight size={24} />
      </button> */}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              currentSlide === index
                ? 'w-12 h-3 bg-orange-600'
                : 'w-3 h-3 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* {isAutoPlaying && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
          Auto-playing
        </div>
      )} */}
    </div>
  );
}

export default Swiper;