"use client";

import { useState } from "react";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SearchProps {
  initialQuery: string;
  initialLocation: string;
  initialCategory: string;
}

export default function MarketplaceSearch({ initialQuery, initialLocation, initialCategory }: SearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (initialCategory) params.set("category", initialCategory);
    
    router.push(`/?${params.toString()}`);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    toast.loading("Pinpointing your neighborhood...", { id: "location-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          
          const detectedPlace = data.address.suburb || data.address.town || data.address.city || data.address.county || "";
          
          if (detectedPlace) {
            setLocation(detectedPlace);
            toast.success(`Found you in ${detectedPlace}!`, { id: "location-toast" });
          } else {
            toast.error("Could not determine exact location.", { id: "location-toast" });
          }
        } catch (error) {
          toast.error("Failed to detect location.", { id: "location-toast" });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("Location access denied.", { id: "location-toast" });
        setIsLocating(false);
      }
    );
  };

  return (
    <form onSubmit={handleSearch} className="z-10 w-full max-w-4xl mx-auto flex flex-col sm:flex-row bg-white rounded-3xl sm:rounded-full border border-slate-200/80 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 overflow-hidden">
      
      {/* What to find */}
      <div className="flex-1 flex items-center px-6 py-4 border-b sm:border-b-0 sm:border-r border-slate-100 group">
        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors shrink-0" />
        <div className="flex flex-col w-full pl-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Looking for</span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Stores, products, or brands..." 
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-300 outline-none text-sm font-semibold"
          />
        </div>
      </div>

      {/* Where to find it */}
      <div className="flex-1 flex items-center px-6 py-4 relative group">
        <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors shrink-0" />
        <div className="flex flex-col w-full pl-3 pr-10">
           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Neighborhood</span>
          <input 
            type="text" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter town or area" 
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-300 outline-none text-sm font-semibold"
          />
        </div>
        <button 
          type="button" 
          onClick={detectLocation}
          disabled={isLocating}
          className="absolute right-4 p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
          title="Use my current location"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Navigation className="h-4 w-4" />}
        </button>
      </div>

      {/* Submit */}
      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 transition-all text-sm w-full sm:w-auto flex items-center justify-center gap-2 m-1.5 sm:rounded-full rounded-2xl active:scale-95">
        <Search className="h-4 w-4" /> Search
      </button>
    </form>
  );
}