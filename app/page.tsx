import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Sparkles, Smartphone, Sofa, Shirt, ShoppingBag, MapPin, Coffee, ChevronRight, Grid, ShieldCheck, Star, Users, Clock, Tag } from "lucide-react";
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

export default async function MarketplaceHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>; 
}) {
  const resolvedParams = await searchParams;

  const searchQuery = resolvedParams.q || "";
  const categoryQuery = resolvedParams.category || "";
  const locationQuery = resolvedParams.location || "";

  // NEW: Added 'category' to the select statement
  const { data, error } = await supabase
    .rpc("search_stores", { 
      search_query: searchQuery, 
      category_filter: categoryQuery,
      location_filter: locationQuery 
    })
    .select("id, name, description, logo_url, county, town, area, tier, category, slug");

  if (error) console.error("Search Error:", error);
  const stores: StoreData[] = (data as StoreData[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-emerald-200">
      
      {/* 1. SLIM TRUST BANNER (Top of page) */}
      <div className="bg-slate-900 text-slate-300 text-[10px] sm:text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-2 font-medium tracking-wide">
          <div className="hidden md:flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Users className="h-3.5 w-3.5" /> 12,450 shoppers today
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> 4.9 Average Rating
            </span>
          </div>
          <div className="flex items-center justify-center w-full sm:w-auto gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified sellers</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Live inventory</span>
            <span className="hidden sm:flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> Fast delivery</span>
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
          <div className="hidden lg:flex items-center gap-3 shrink-0 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <Store className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-emerald-950 leading-none">500+ Active Stores</span>
              <span className="text-xs font-bold text-emerald-600 mt-1">Ready to fulfill orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN LAYOUT: SIDEBAR + STORE GRID */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row gap-6 sm:gap-8">
        
        {/* LEFT SIDEBAR: Categories */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white md:rounded-2xl md:border border-slate-200 md:p-5 md:shadow-sm md:sticky top-24 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="hidden md:flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Grid className="h-4 w-4" /> Categories
              </h2>
              {categoryQuery && (
                <Link href="/" className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                  Clear
                </Link>
              )}
            </div>
            
            {/* Mobile-optimized scrolling category pills */}
            <div className="flex md:flex-col overflow-x-auto snap-x snap-mandatory md:overflow-visible gap-2.5 pb-2 md:pb-0 custom-scrollbar">
              <Link 
                href="/"
                className={`flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-xl font-bold text-sm transition-all whitespace-nowrap snap-start shrink-0 ${
                  !categoryQuery ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 md:border-transparent md:bg-transparent"
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
                        ? `${cat.bg} ${cat.color} shadow-sm ring-2 ring-emerald-500/20 ${cat.border}` 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:border-transparent md:bg-transparent"
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

        {/* RIGHT CONTENT: Store Grid */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {categoryQuery ? `${categoryQuery} Stores` : "Featured Local Stores"}
            </h1>
            <span className="text-xs sm:text-sm font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
              {stores.length} <span className="hidden sm:inline">Results</span>
            </span>
          </div>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {stores.map((store) => {
                const locationText = [store.area, store.town, store.county].filter(Boolean).join(", ");
                return (
                  <Link key={store.id} href={`/${store.slug}`} className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                    
                    {/* Top Accent Banner */}
                    <div className="h-12 w-full bg-gradient-to-r from-slate-50 to-slate-100/50 absolute top-0 left-0 border-b border-slate-100 z-0"></div>

                    <div className="p-5 flex flex-col h-full relative z-10">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        {/* Store Logo */}
                        <div className="shrink-0 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover" />
                          ) : (
                            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Badges (Tier & Category) */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {store.tier === 'VIP' && (
                            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                              <Star className="w-3 h-3 fill-white text-white" /> VIP
                            </span>
                          )}
                          {store.category && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md truncate max-w-[100px]">
                              {store.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Store Info */}
                      <div className="flex-1 min-w-0">
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

                      {/* Call to Action Footer */}
                      <div className="pt-4 mt-5 border-t border-slate-100">
                        <div className="w-full flex items-center justify-between bg-slate-50 group-hover:bg-emerald-50 px-4 py-2.5 rounded-xl transition-colors border border-slate-100 group-hover:border-emerald-100">
                          <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" /> Shop Now
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center shadow-sm flex flex-col items-center">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Store className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">No stores found</h3>
              <p className="text-slate-500 mt-2 text-sm sm:text-base max-w-md mx-auto">
                We couldn't find any stores matching your current filters. Try adjusting your search or category.
              </p>
              {(searchQuery || categoryQuery || locationQuery) && (
                <Link href="/" className="mt-8 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95">
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