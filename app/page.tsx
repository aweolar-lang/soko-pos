import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Sparkles, BookOpen, Smartphone, Sofa, Shirt, ShoppingBag, MapPin, Coffee, ChevronRight, XCircle, Grid, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-[#fafafa] font-sans flex flex-col selection:bg-emerald-200">
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 inset-x-0 h-[500px] overflow-hidden -z-10 opacity-40 pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-emerald-300 blur-[128px] rounded-full"></div>
        <div className="absolute top-12 right-12 w-96 h-96 bg-blue-200 blur-[128px] rounded-full"></div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        
        {/* HERO SECTION */}
        <div className="mb-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
             <ShieldCheck className="h-4 w-4 text-emerald-500" />
             <span className="text-xs font-bold text-slate-600">Trusted by 500+ local sellers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
            Shop your street, <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">from your screen.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-12 font-medium max-w-2xl mx-auto">
            Discover verified neighborhood stores, browse live inventory, and support the community right outside your door.
          </p>
          
          <MarketplaceSearch 
            initialQuery={searchQuery} 
            initialLocation={locationQuery} 
            initialCategory={categoryQuery} 
          />
        </div>

        {/* CATEGORIES */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Explore by Category</h2>
            {(searchQuery || categoryQuery || locationQuery) && (
              <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                <XCircle className="h-4 w-4" /> Clear Filters
              </Link>
            )}
          </div>

          <div className="flex overflow-x-auto pb-6 gap-5 hide-scrollbar snap-x">
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
                  className={`snap-start group flex flex-col items-center gap-4 p-5 min-w-[130px] rounded-[2rem] transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 shadow-xl shadow-slate-900/10 -translate-y-1' 
                      : 'bg-white hover:bg-slate-50 border border-slate-100 hover:shadow-md'
                  }`}
                >
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isActive ? 'bg-slate-800 text-white' : `${category.bg} ${category.color}`}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className={`text-sm font-bold text-center ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* STORE CARDS */}
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
            Top Merchants 
            <span className="bg-emerald-100 text-emerald-700 text-sm py-1 px-3 rounded-full">{stores.length}</span>
          </h2>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {stores.map((store) => {
                const locationParts = [store.area, store.town].filter(Boolean);
                const displayLocation = locationParts.length > 0 ? locationParts.join(", ") : "Digital Merchant";

                return (
                  <Link key={store.id} href={`/${store.slug}`} className="group flex flex-col bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
                    
                    {/* Abstract Cover Art generator based on store name length */}
                    <div className={`h-32 relative bg-gradient-to-br ${store.name.length % 2 === 0 ? 'from-emerald-400 to-teal-600' : 'from-slate-800 to-slate-900'}`}>
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl mix-blend-overlay"></div>
                       {store.tier === 'VIP' && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative bg-white">
                      {/* Floating Logo */}
                      <div className="h-20 w-20 bg-white rounded-[1.25rem] border-4 border-white shadow-lg flex items-center justify-center shrink-0 -mt-10 mb-4 overflow-hidden z-10">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-8 w-8 text-slate-300" />
                        )}
                      </div>

                      <h3 className="font-black text-xl text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">{store.name}</h3>
                      <p className="text-sm font-medium text-slate-500 line-clamp-2 mt-2 flex-1 leading-relaxed">
                        {store.description || "Browse our beautiful local inventory and discover great deals today."}
                      </p>
                      
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="truncate max-w-[140px]">{displayLocation}</span>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:shadow-md transition-all">
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-32 bg-white rounded-[2rem] border border-slate-200/60 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Store className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">No merchants found here</h3>
              <p className="text-base font-medium text-slate-500 max-w-md mb-8">We couldn't find any stores matching your exact filters. Try broadening your search or exploring a new category.</p>
              <Link href="/" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg shadow-slate-900/20">
                Explore All Stores
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}