import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Sparkles, Smartphone, Sofa, Shirt, ShoppingBag, MapPin, Coffee, ChevronRight, Grid, ShieldCheck, Star, Users, Clock } from "lucide-react";
import MarketplaceSearch from "@/components/MarketplaceSearch";

export const revalidate = 0; 

const CATEGORIES = [
  { name: "Food & Cafe", icon: Coffee, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { name: "Electronics", icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { name: "Furniture", icon: Sofa, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { name: "Fashion", icon: Shirt, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { name: "Supermarket", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { name: "Beauty", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { name: "Services", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
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

  const { data, error } = await supabase
    .rpc("search_stores", { 
      search_query: searchQuery, 
      category_filter: categoryQuery,
      location_filter: locationQuery 
    })
    .select("id, name, description, logo_url, county, town, area, tier, slug");

  if (error) console.error("Search Error:", error);
  const stores: StoreData[] = (data as StoreData[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-emerald-200">
      
      {/* 1. SLIM TRUST BANNER (Top of page) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-2 font-medium tracking-wide">
          <div className="hidden md:flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Users className="h-3.5 w-3.5" /> 12,450 shoppers today
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> 4.9 Average Rating
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified sellers</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Live inventory</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> Fast delivery</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER & SEARCH SPACE */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-6 shadow-sm z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 max-w-3xl w-full">
            {/* FIXED: Passed required props to MarketplaceSearch */}
            <MarketplaceSearch 
              initialQuery={searchQuery}
              initialCategory={categoryQuery}
              initialLocation={locationQuery}
            />
          </div>
          <div className="hidden lg:flex items-center gap-3 shrink-0 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
            <Store className="h-5 w-5 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-emerald-900 leading-none">500+ Active Stores</span>
              <span className="text-xs font-bold text-emerald-600 mt-0.5">Ready to fulfill orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN LAYOUT: SIDEBAR + STORE GRID */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR: Categories */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Grid className="h-4 w-4" /> Categories
              </h2>
              {categoryQuery && (
                <Link href="/" className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                  Clear
                </Link>
              )}
            </div>
            
            <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
              <Link 
                href="/"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  !categoryQuery ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                      isActive 
                        ? `${cat.bg} ${cat.color} shadow-sm border ${cat.border}` 
                        : "text-slate-600 hover:bg-slate-50 border border-transparent"
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {categoryQuery ? `${categoryQuery} Stores` : "Featured Local Stores"}
            </h1>
            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
              {stores.length} Results
            </span>
          </div>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => {
                const locationText = [store.area, store.town, store.county].filter(Boolean).join(", ");
                return (
                  <Link key={store.id} href={`/${store.slug}`} className="group relative bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                          <Store className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                          <span className="truncate">{store.name}</span>
                          {/* FIXED: Wrapped Star in a span to hold the title attribute securely */}
                          {store.tier === 'VIP' && (
                            <span title="VIP Verified Store" className="flex shrink-0">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            </span>
                          )}
                        </h3>
                        {locationText && (
                          <p className="text-slate-500 text-xs font-medium mt-1.5 flex items-center gap-1 truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {locationText}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-1">
                      {store.description || "Discover great products from this local seller."}
                    </p>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <ShoppingBag className="h-4 w-4" /> View Inventory
                      </div>
                      <div className="flex items-center justify-center h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full transition-all group-hover:bg-emerald-600 group-hover:text-white">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm flex flex-col items-center">
              <Store className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No stores found</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                We couldn't find any stores matching your current filters. Try adjusting your search or category.
              </p>
              {(searchQuery || categoryQuery || locationQuery) && (
                <Link href="/" className="mt-8 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95">
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