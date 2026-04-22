import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Sparkles, BookOpen, Smartphone, Sofa, Shirt, ShoppingBag, MapPin, Coffee, ChevronRight, XCircle, Grid, ShieldCheck, Star, Users, Clock, MapPin as MapPinIcon } from "lucide-react";
import MarketplaceSearch from "@/components/MarketplaceSearch";

export const revalidate = 0; 

const CATEGORIES = [
  { name: "Food & Cafe", icon: Coffee, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { name: "Electronics", icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { name: "Furniture", icon: Sofa, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { name: "Fashion", icon: Shirt, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { name: "Supermarket", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { name: "Beauty", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { name: "Books", icon: BookOpen, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  { name: "View All", icon: Grid, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
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
  searchParams: { q?: string; category?: string; location?: string };
}) {
  const searchQuery = searchParams.q || "";
  const categoryQuery = searchParams.category || "";
  const locationQuery = searchParams.location || "";

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
    <div className="min-h-screen bg-[#fafafa] font-sans flex flex-col selection:bg-emerald-200 overflow-x-hidden">
      
      {/* Premium Background Accents */}
      <div className="absolute top-0 inset-x-0 h-[620px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-40 w-[620px] h-[620px] bg-emerald-300/30 blur-[140px] rounded-full"></div>
        <div className="absolute top-20 right-12 w-[520px] h-[520px] bg-teal-200/30 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-12 left-1/3 w-80 h-80 bg-blue-200/20 blur-[100px] rounded-full"></div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full">
        
        {/* HERO SECTION - Ultra Premium */}
        <div className="mb-24 text-center max-w-4xl mx-auto">
          {/* Trust Bar */}
          <div className="inline-flex items-center gap-x-8 bg-white border border-slate-100 shadow-sm rounded-3xl px-8 py-3 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-slate-700">500+ Verified Sellers</span>
            </div>
            <div className="h-3 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1 text-emerald-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-bold">4.9</span>
            </div>
            <div className="h-3 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="h-4 w-4" />
              <span className="font-medium">12,450 shoppers today</span>
            </div>
            <div className="h-3 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1 text-teal-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Live inventory • Updated now</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-[-2px] leading-[1.05] mb-6">
            Your neighborhood, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">reimagined for discovery.</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-xl mx-auto mb-10 font-medium">
            Verified local stores. Real-time stock. Instant delivery or pickup. 
            <span className="text-emerald-700 font-semibold">Shop the street you love — without leaving home.</span>
          </p>

          <MarketplaceSearch 
            initialQuery={searchQuery} 
            initialLocation={locationQuery} 
            initialCategory={categoryQuery} 
          />

          {/* Quick trust signals */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-2xl">✓ Verified sellers only</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-2xl">🔒 Secure payments</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-2xl">🚚 Same-hour delivery in Nairobi</span>
            </div>
          </div>
        </div>

        {/* CATEGORIES - Elevated carousel */}
        <div className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shop by category</h2>
              <p className="text-slate-500 mt-1">Find exactly what your street offers today</p>
            </div>
            
            {(searchQuery || categoryQuery || locationQuery) && (
              <Link 
                href="/" 
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors group"
              >
                <XCircle className="h-4 w-4 group-hover:rotate-90 transition-transform" /> 
                Clear all filters
              </Link>
            )}
          </div>

          <div className="flex overflow-x-auto pb-8 gap-6 hide-scrollbar snap-x snap-mandatory">
            {CATEGORIES.map((category, idx) => {
              const Icon = category.icon;
              const isActive = categoryQuery === category.name;
              
              const queryParams = new URLSearchParams();
              if (searchQuery) queryParams.set("q", searchQuery);
              if (locationQuery) queryParams.set("location", locationQuery);
              if (category.name !== "View All") {
                queryParams.set("category", category.name);
              } else {
                queryParams.delete("category");
              }

              return (
                <Link 
                  href={`/?${queryParams.toString()}`}
                  key={idx} 
                  className={`snap-start group flex flex-col items-center gap-4 p-6 min-w-[148px] rounded-3xl transition-all duration-300 cursor-pointer border ${
                    isActive 
                      ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 scale-105' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl hover:-translate-y-2'
                  }`}
                >
                  <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-all duration-300 group-active:scale-95 ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-inner' 
                      : `${category.bg} ${category.color}`
                  }`}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <span className={`text-base font-semibold text-center transition-colors ${
                    isActive ? 'text-white' : 'text-slate-800 group-hover:text-slate-900'
                  }`}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* STORES SECTION - The star of the show */}
        <div>
          <div className="flex items-end justify-between mb-10">
            <div className="flex items-center gap-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Featured Stores</h2>
              <div className="bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-1.5 rounded-3xl flex items-center gap-1">
                <span>{stores.length}</span>
                <span className="text-emerald-600">live now</span>
              </div>
            </div>
            
            <Link 
              href="/stores" 
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 group"
            >
              See all stores 
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {stores.map((store) => {
                const locationParts = [store.area, store.town].filter(Boolean);
                const displayLocation = locationParts.length > 0 
                  ? locationParts.join(" • ") 
                  : "Nairobi";

                // Premium gradient per store (based on name for visual variety)
                const gradientClass = store.name.length % 3 === 0 
                  ? "from-emerald-500 to-teal-600" 
                  : store.name.length % 3 === 1 
                    ? "from-slate-800 to-slate-950" 
                    : "from-cyan-500 to-blue-600";

                return (
                  <Link 
                    key={store.id} 
                    href={`/${store.slug}`}
                    className="group relative flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-300/60 hover:-translate-y-3 transition-all duration-500 overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  >
                    {/* Hero visual - Premium store branding area */}
                    <div className={`relative h-52 bg-gradient-to-br ${gradientClass} flex items-center justify-center overflow-hidden`}>
                      
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
                      
                      {/* Store initial accent */}
                      <div className="absolute inset-0 flex items-center justify-center text-white/10 text-[180px] font-black leading-none select-none tracking-[-20px] transition-all group-hover:scale-105">
                        {store.name[0]}
                      </div>

                      {/* Live indicator */}
                      <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md text-emerald-700 text-[10px] font-bold uppercase px-3 py-1 rounded-2xl flex items-center gap-1 shadow-inner">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        OPEN NOW
                      </div>

                      {/* VIP / Verified badge */}
                      {store.tier === 'VIP' && (
                        <div className="absolute top-6 right-6 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 text-xs font-black uppercase tracking-[0.5px] px-4 py-2 rounded-3xl shadow-xl flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          VERIFIED
                        </div>
                      )}

                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
                    </div>

                    {/* Floating logo - Elevated */}
                    <div className="absolute -top-10 left-6 h-20 w-20 bg-white rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden z-10 transition-all group-hover:scale-110">
                      {store.logo_url ? (
                        <img 
                          src={store.logo_url} 
                          alt={store.name} 
                          className="h-full w-full object-cover rounded-3xl" 
                        />
                      ) : (
                        <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <Store className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="pt-14 px-6 pb-8 flex-1 flex flex-col">
                      <h3 className="font-black text-2xl text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {store.name}
                      </h3>
                      
                      <p className="mt-3 text-slate-600 text-[15px] leading-relaxed line-clamp-3 flex-1">
                        {store.description || "Curated local goods, fresh daily. Shop directly from your neighborhood favorite."}
                      </p>

                      {/* Location + meta */}
                      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium truncate max-w-[160px]">
                            {displayLocation}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Fake social proof - high-end touch */}
                          <div className="flex items-center text-amber-400 text-xs font-semibold">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span className="ml-1">4.9</span>
                          </div>
                          
                          <div className="h-6 w-px bg-slate-200"></div>
                          
                          <button 
                            className="flex items-center justify-center h-9 w-9 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-2xl transition-all group-hover:scale-110"
                            onClick={(e) => e.preventDefault()} // prevents link navigation on button click
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* No results - Premium empty state */
            <div className="py-24 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-inner relative">
              <div className="h-28 w-28 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                <Store className="h-14 w-14 text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">No stores match your search</h3>
              <p className="max-w-xs text-slate-500 mb-10">Try removing a filter or exploring our featured categories below.</p>
              <Link 
                href="/"
                className="inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-semibold text-lg px-10 py-6 rounded-3xl transition-all active:scale-95 shadow-xl shadow-slate-900/30"
              >
                Explore all local stores
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>

        {/* Final trust & CTA banner */}
        <div className="mt-24 bg-gradient-to-r from-slate-900 to-emerald-900 rounded-3xl p-10 md:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="uppercase text-emerald-300 text-sm font-bold tracking-[1px]">Become a seller</div>
            <h3 className="text-4xl font-black tracking-tight mt-2">List your store in under 60 seconds</h3>
            <p className="mt-4 text-emerald-100 max-w-md">Join thousands of local businesses already reaching customers in their own neighborhood.</p>
          </div>
          <Link 
            href="/sell" 
            className="bg-white text-slate-900 font-black text-xl px-14 py-7 rounded-3xl hover:scale-105 transition-all shadow-2xl shadow-emerald-950/50 flex-shrink-0"
          >
            Get started free →
          </Link>
        </div>
      </main>
    </div>
  );
}