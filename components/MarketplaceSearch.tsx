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
    toast.loading("Detecting location...", { id: "location-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          
          const detectedPlace = data.address.suburb || data.address.town || data.address.city || data.address.county || "";
          
          if (detectedPlace) {
            setLocation(detectedPlace);
            toast.success(`Location set to ${detectedPlace}`, { id: "location-toast" });
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
    <form onSubmit={handleSearch} className="z-10 w-full max-w-4xl flex flex-col sm:flex-row bg-white border border-slate-300 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
      
      {/* What to find */}
      <div className="flex-1 flex items-center px-4 py-3.5 border-b sm:border-b-0 sm:border-r border-slate-200">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search inventory, brands, or stores..." 
          className="w-full pl-3 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm font-medium"
        />
      </div>

      {/* Where to find it */}
      <div className="flex-1 flex items-center px-4 py-3.5 relative group bg-slate-50/50">
        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
        <input 
          type="text" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location or Zip Code" 
          className="w-full pl-3 pr-10 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm font-medium"
        />
        <button 
          type="button" 
          onClick={detectLocation}
          disabled={isLocating}
          className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
          title="Use GPS"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-slate-900" /> : <Navigation className="h-4 w-4" />}
        </button>
      </div>

      {/* Submit */}
      <button type="submit" className="bg-slate-900 hover:bg-black text-white font-semibold py-3.5 sm:px-10 transition-colors text-sm w-full sm:w-auto">
        Search
      </button>
    </form>
  );
}