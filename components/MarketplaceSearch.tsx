"use client";

import { useState, type FormEvent } from "react";
import { Search, MapPin, Navigation, Loader2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

interface SearchProps {
  initialQuery: string;
  initialLocation: string;
  initialCategory?: string;
}

export default function MarketplaceSearch({
  initialQuery,
  initialLocation,
  initialCategory = "",
}: SearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(initialQuery ?? "");
  const [location, setLocation] = useState(initialLocation ?? "");
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    if (initialCategory.trim()) params.set("category", initialCategory.trim());

    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(url);
  };

  const clearSearch = () => {
    setQuery("");
    setLocation("");
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

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Reverse geocode request failed");
          }

          const data = await response.json();
          const detectedPlace =
            data?.address?.suburb ||
            data?.address?.town ||
            data?.address?.city ||
            data?.address?.county ||
            "";

          if (detectedPlace) {
            setLocation(detectedPlace);
            toast.success(`Found you in ${detectedPlace}!`, { id: "location-toast" });
          } else {
            toast.error("Could not determine exact location.", { id: "location-toast" });
          }
        } catch {
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
    <form
      onSubmit={handleSearch}
      className="z-10 mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 sm:flex-row sm:rounded-full"
    >
      <div className="group flex flex-1 items-center border-b border-slate-100 px-6 py-4 sm:border-b-0 sm:border-r">
        <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
        <div className="flex w-full flex-col pl-3">
          <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Looking for
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Stores, products, or brands..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="group relative flex flex-1 items-center px-6 py-4">
        <MapPin className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
        <div className="flex w-full flex-col pl-3 pr-10">
          <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Neighborhood
          </span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter town or area"
            className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={detectLocation}
          disabled={isLocating}
          className="absolute right-4 rounded-full bg-slate-50 p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed"
          title="Use my current location"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="m-1.5 flex w-full gap-2 sm:w-auto">
        {(query || location) && (
          <button
            type="button"
            onClick={clearSearch}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 sm:rounded-full"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}

        <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white transition-all active:scale-95 hover:bg-emerald-500 sm:w-auto sm:rounded-full"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  );
}