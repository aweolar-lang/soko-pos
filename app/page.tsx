import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Sparkles, BookOpen, Smartphone, Sofa, Shirt, ShoppingBag, MapPin, Coffee, ChevronRight, XCircle, Grid } from "lucide-react";
import MarketplaceSearch from "@/components/MarketplaceSearch";

export const revalidate = 0; 

// YOUR VIBRANT CATEGORIES ARE BACK!
const CATEGORIES = [
  { name: "Food & Cafe", icon: Coffee, color: "text-orange-600", bg: "bg-orange-100" },
  { name: "Electronics", icon: Smartphone, color: "text-blue-600", bg: "bg-blue-100" },
  { name: "Furniture", icon: Sofa, color: "text-amber-600", bg: "bg-amber-100" },
  { name: "Fashion", icon: Shirt, color: "text-pink-600", bg: "bg-pink-100" },
  { name: "Supermarket", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100" },
  { name: "Beauty & Wellness", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-100" },
  { name: "Books & Media", icon: BookOpen, color: "text-yellow-600", bg: "bg-yellow-100" },
  { name: "All Categories", icon: Grid, color: "text-slate-600", bg: "bg-slate-100" },
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

  // Fetch from the powerful database function we built
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* PREMIUM HERO SECTION */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Discover local <span className="text-emerald-600">favorites.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 font-medium">
            Shop directly from the best neighborhood stores, track live inventory, and support your local community.
          </p>
          
          <div className="flex justify-center w-full">
            <MarketplaceSearch 
              initialQuery={searchQuery} 
              initialLocation={locationQuery} 
              initialCategory={categoryQuery} 
            />
          </div>
        </div>

        {/* YOUR COLORFUL CATEGORIES */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900">Explore Categories</h2>
            {(searchQuery || categoryQuery || locationQuery) && (
              <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-3 py-1.5 rounded-full">
                <XCircle className="h-4 w-4" /> Clear Filters
              </Link>
            )}
          </div>

          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
            {CATEGORIES.map((category, idx) => {
              const Icon = category.icon;
              const isActive = categoryQuery === category.name;
              
              const queryParams = new URLSearchParams();
              if (searchQuery) queryParams.set("q", searchQuery);
              if (locationQuery) queryParams.set("location", locationQuery);
              queryParams.set("category", category.name);

              return (
                <Link 
                  href={`/?${queryParams.toString()}`}
                  key={idx} 
                  className={`flex flex-col items-center gap-3 p-4 min-w-[120px] rounded-3xl border-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${category.bg} ${category.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 text-center">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* PREMIUM STORE CARDS */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
            Top Merchants <span className="text-emerald-600">({stores.length})</span>
          </h2>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stores.map((store) => {
                const locationParts = [store.area, store.town].filter(Boolean);
                const displayLocation = locationParts.length > 0 ? locationParts.join(", ") : "Digital Merchant";

                return (
                  <Link key={store.id} href={`/${store.slug}`} className="group flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="h-24 bg-gradient-to-r from-emerald-100 to-teal-50 relative">
                       {store.tier === 'VIP' && (
                        <div className="absolute top-3 right-3 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                          Verified
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative">
                      {/* Floating Logo */}
                      <div className="h-16 w-16 bg-white rounded-2xl border-4 border-white shadow-md flex items-center justify-center shrink-0 -mt-8 mb-3 overflow-hidden">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-6 w-6 text-slate-300" />
                        )}
                      </div>

                      <h3 className="font-black text-lg text-slate-900 line-clamp-1">{store.name}</h3>
                      <p className="text-sm font-medium text-slate-500 line-clamp-2 mt-1 flex-1">
                        {store.description || "Browse our beautiful local inventory."}
                      </p>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="truncate max-w-[120px]">{displayLocation}</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                          <ChevronRight className="h-4 w-4 text-emerald-600 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-24 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Store className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No merchants found</h3>
              <p className="text-base font-medium text-slate-500 max-w-sm mb-6">We couldn't find any stores matching your current filters.</p>
              <Link href="/" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95">
                View All Stores
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}