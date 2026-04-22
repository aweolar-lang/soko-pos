"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";

export default function ProductGallery({ images, title }: { images: string[], title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ 
        left: direction === "left" ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  };

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
        <ShoppingBag className="h-20 w-20 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group">
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        {images.map((img, index) => (
          <div key={index} className="min-w-full h-full snap-center relative">
            <img 
              src={img} 
              alt={`${title} - Image ${index + 1}`} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Desktop Navigation Arrows (Hidden on mobile, appear on hover on desktop) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.preventDefault(); scroll("left"); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button 
            onClick={(e) => { e.preventDefault(); scroll("right"); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
            {images.map((_, i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-white/60 backdrop-blur-sm border border-black/10 shadow-sm" />
            ))}
          </div>

          {/* Swipe hint for mobile only */}
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 pointer-events-none md:hidden">
            Swipe <ChevronRight className="h-3 w-3" />
          </div>
        </>
      )}
    </div>
  );
}