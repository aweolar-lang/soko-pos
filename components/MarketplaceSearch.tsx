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
    toast.loading("Detecting your location...", { id: "location-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap's free reverse geocoding API to get the town name
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          
          // Try to extract the most relevant local area (Suburb, Town, City, or County)
          const detectedPlace = data.address.suburb || data.address.town || data.address.city || data.address.county || "";
          
          if (detectedPlace) {
            setLocation(detectedPlace);
            toast.success(`Location set to ${detectedPlace}`, { id: "location-toast" });
          } else {
            toast.error("Could not determine your exact town.", { id: "location-toast" });
          }
        } catch (error) {
          toast.error("Failed to detect location.", { id: "location-toast" });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        toast.error("Location access denied. Please type it manually.", { id: "location-toast" });
        setIsLocating(false);
      }
    );
  };

  return (
    <form onSubmit={handleSearch} className="z-10 w-full max-w-4xl flex flex-col sm:flex-row bg-white rounded-2xl sm:rounded-full p-2 shadow-xl shadow-emerald-900/20 gap-2 sm:gap-0 border border-emerald-800/20">
      
      {/* What to find */}
      <div className="flex-1 flex items-center px-4 py-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products or stores (e.g. iPhone 15)" 
          className="w-full pl-3 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm font-bold"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-10 bg-slate-200 self-center" />

      {/* Where to find it */}
      <div className="flex-1 flex items-center px-4 py-3 border-t sm:border-t-0 border-slate-100 relative group">
        <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
        <input 
          type="text" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="County, Town, or Area" 
          className="w-full pl-3 pr-10 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm font-bold"
        />
        {/* GPS Detect Button */}
        <button 
          type="button" 
          onClick={detectLocation}
          disabled={isLocating}
          className="absolute right-3 p-2 bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors tooltip-trigger"
          title="Use my current GPS location"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Navigation className="h-4 w-4" />}
        </button>
      </div>

      {/* Submit */}
      <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 sm:py-0 sm:px-10 rounded-xl sm:rounded-full transition-all active:scale-95 w-full sm:w-auto mt-2 sm:mt-0 shadow-md shadow-emerald-500/20">
        Search
      </button>
    </form>
  );
}