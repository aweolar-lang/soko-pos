import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Store,
  Sparkles,
  Smartphone,
  Sofa,
  Shirt,
  ShoppingBag,
  MapPin,
  Coffee,
  ChevronRight,
  Grid,
  ShieldCheck,
  Star,
  Users,
  Clock,
  Tag,
  Download,
} from "lucide-react";
import MarketplaceSearch from "@/components/MarketplaceSearch";

export const revalidate = 0;

const CATEGORIES = [
  { name: "Food & Beverage", icon: Coffee, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { name: "Electronics", icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { name: "Furniture", icon: Sofa, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { name: "Fashion", icon: Shirt, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { name: "Supermarket", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { name: "Beauty", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { name: "Services", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { name: "Digital Products", icon: Tag, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { name: "Other", icon: Store, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
];

interface StoreData {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  county: string;
  town: string;
  area: string;
  tier: string;
  category: string;
  slug: string;
}

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

const isHotelStore = (store: StoreData) => store.category === "Food & Beverage";

const isDigitalStore = (store: StoreData) => store.category === "Digital Products";

const getStoreCta = (store: StoreData) => {
  if (isHotelStore(store)) {
    return {
      label: "Make Order",
      icon: Coffee,
    };
  }

  if (isDigitalStore(store)) {
    return {
      label: "Download",
      icon: Download,
    };
  }

  return {
    label: "Visit Store",
    icon: ShoppingBag,
  };
};

export default async function MarketplaceHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
}) {
  const resolvedParams = await searchParams;

  const searchQuery = resolvedParams.q || "";
  const categoryQuery = resolvedParams.category || "";
  const locationQuery = resolvedParams.location || "";

  const { data, error } = await supabase
    .rpc("search_stores", {
      search_query: searchQuery,
      category_filter: categoryQuery,
      location_filter: locationQuery,
    })
    .select("id, name, description, logo_url, county, town, area, tier, category, slug");

  if (error) console.error("Search Error:", error);

  const stores: StoreData[] = (data as StoreData[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-emerald-200">
      {/* 1. SLIM TRUST BANNER */}
      <div className="bg-slate-900 text-slate-300 text-[10px] sm:text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center lg:justify-between gap-x-6 gap-y-2 font-medium tracking-wide">
          <div className="hidden lg:flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Users className="h-3.5 w-3.5" /> 12,450 shoppers today
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> 4.9 Average Rating
            </span>
          </div>
          <div className="flex items-center justify-center w-full lg:w-auto gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified sellers
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" /> Live inventory
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Fast delivery
            </span>
          </div>
        </div>
      </div>

      {/* 2. HEADER & SEARCH SPACE */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-6 shadow-sm z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex-1 max-w-3xl w-full">
            <MarketplaceSearch
              initialQuery={searchQuery}
              initialCategory={categoryQuery}
              initialLocation={locationQuery}
            />
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0 bg-emerald-50/50 px-5 py-3.5 rounded-2xl border border-emerald-100 shadow-sm transition-transform hover:scale-105">
            <div className="bg-white p-2.5 rounded-xl shadow-sm">
              <Store className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-emerald-950 leading-none">500+ Active Stores</span>
              <span className="text-xs font-bold text-emerald-600 mt-1">Ready to fulfill orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN LAYOUT */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-10">
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white p-3 md:rounded-2xl md:border border-slate-200 md:p-5 md:shadow-sm md:sticky top-8 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="hidden md:flex items-center justify-between mb-5">
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Grid className="h-4 w-4" /> Categories
              </h2>
              {categoryQuery && (
                <Link href="/" className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                  Clear
                </Link>
              )}
            </div>

            <div
              className="flex md:flex-col overflow-x-auto snap-x snap-mandatory md:overflow-visible gap-2.5 pb-2 md:pb-0 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <Link
                href="/"
                className={`flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap snap-start shrink-0 ${
                  !categoryQuery
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 md:ring-2 ring-slate-900/20"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 md:border-transparent md:bg-transparent md:hover:bg-slate-100"
                }`}
              >
                <Grid className="h-4 w-4" />
                All Stores
              </Link>

              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = categoryQuery === cat.name;

                return (
                  <Link
                    key={cat.name}
                    href={`/?category=${encodeURIComponent(cat.name)}`}
                    className={`flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap snap-start shrink-0 border ${
                      isActive
                        ? `${cat.bg} ${cat.color} shadow-sm md:ring-2 ring-emerald-500/20 ${cat.border}`
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:border-transparent md:bg-transparent md:hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {categoryQuery ? `${categoryQuery} Stores` : "Featured Local Stores"}
            </h1>
            <span className="text-xs sm:text-sm font-bold text-slate-500 bg-white px-3.5 py-1.5 rounded-full shadow-sm border border-slate-200">
              {stores.length} <span className="hidden sm:inline">Results</span>
            </span>
          </div>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => {
                const locationText = [store.area, store.town, store.county].filter(Boolean).join(", ");
                
                // THE FIX: We now correctly pass the entire `store` object!
                const { label: ctaLabel, icon: CtaIcon } = getStoreCta(store);

                return (
                  <Link
                    key={store.id}
                    href={`/${store.slug}`}
                    className="group flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden relative active:scale-[0.98]"
                  >
                    {/* Store Cover Banner */}
                    <div className="h-20 w-full bg-gradient-to-r from-emerald-50/50 via-slate-100 to-slate-50 border-b border-slate-100 relative">
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                        {store.tier === "VIP" && (
                          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                            <Star className="w-3 h-3 fill-white text-white" /> VIP
                          </span>
                        )}
                        {store.category && (
                          <span className="bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200/50 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm truncate max-w-[120px]">
                            {store.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-0 flex flex-col h-full relative">
                      {/* Store Logo */}
                      <div className="-mt-8 mb-3 shrink-0 relative z-20">
                        <div className="inline-block p-1 bg-white rounded-2xl shadow-sm border border-slate-200 group-hover:border-emerald-200 transition-colors">
                          {store.logo_url ? (
                            <img
                              src={store.logo_url}
                              alt={store.name}
                              // THE FIX: Updated to valid standard Tailwind classes
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover bg-slate-50"
                            />
                          ) : (
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Store className="h-8 w-8 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Store Info */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {store.name}
                        </h3>

                        {locationText && (
                          <p className="text-slate-500 text-xs font-medium mt-1.5 flex items-center gap-1.5 line-clamp-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {locationText}
                          </p>
                        )}

                        <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                          {store.description || "Discover great products from this local seller."}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="mt-6 pt-1">
                        <div className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold px-4 py-3 rounded-xl border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                          <CtaIcon className="h-4 w-4" />
                          <span className="text-sm">{ctaLabel}</span>
                          <ChevronRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-20 text-center shadow-sm flex flex-col items-center">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                <Store className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">No stores found</h3>
              <p className="text-slate-500 mt-3 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                We couldn't find any stores matching your current filters. Try adjusting your search or switching categories.
              </p>
              {(searchQuery || categoryQuery || locationQuery) && (
                <Link
                  href="/"
                  className="mt-8 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}