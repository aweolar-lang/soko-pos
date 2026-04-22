import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, MapPin, Coffee, Smartphone, Sofa, Shirt, HelpCircle, ShoppingBag, Star, ArrowRight, XCircle } from "lucide-react";
import MarketplaceSearch from "@/components/MarketplaceSearch"; // Import our new Client Component!

export const revalidate = 0; 

const CATEGORIES = [
  { name: "Food & Cafe", icon: Coffee, color: "text-orange-600", bg: "bg-orange-100" },
  { name: "Electronics", icon: Smartphone, color: "text-blue-600", bg: "bg-blue-100" },
  { name: "Furniture", icon: Sofa, color: "text-amber-600", bg: "bg-amber-100" },
  { name: "Fashion", icon: Shirt, color: "text-pink-600", bg: "bg-pink-100" },
  { name: "Supermarket", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100" },
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

  // Call the elite Postgres function (Ensure you ran the SQL from the previous step!)
  const { data, error } = await supabase
    .rpc("search_stores", { 
      search_query: searchQuery, 
      category_filter: categoryQuery,
      location_filter: locationQuery 
    })
    .select("id, name, description, logo_url, county, town, area, tier, slug");

  if (error) console.error("Search Error:", error);

  // Safely cast the data so TypeScript stops complaining about .length
  const stores: StoreData[] = (data as StoreData[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-emerald-200">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 w-full bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
              <Store className="h-6 w-6" />
              LocalSoko
            </Link>
            <Link href="/guide" className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <HelpCircle className="h-4 w-4" /> How it Works
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Log In</Link>
            <Link href="/auth/login" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5">
              Sell on Soko <ArrowRight className="h-4 w-4 hidden sm:block" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* HERO SECTION WITH DUAL SEARCH BAR */}
        <div className="bg-emerald-950 rounded-3xl p-8 sm:p-14 text-white mb-10 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <MapPin className="h-96 w-96" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-4 z-10 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">
            Find it locally.
          </h1>
          <p className="text-emerald-200/80 mb-10 z-10 font-medium max-w-lg">
            Search thousands of local stores and products. From electronics to fresh coffee, find exactly what you need in your area.
          </p>
          
          {/* Injecting our interactive Client Component here */}
          <MarketplaceSearch 
            initialQuery={searchQuery} 
            initialLocation={locationQuery} 
            initialCategory={categoryQuery} 
          />
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Browse Categories</h2>
            {(searchQuery || categoryQuery || locationQuery) && (
              <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                <XCircle className="h-4 w-4" /> Clear Filters
              </Link>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
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
                  className="flex flex-col items-center gap-3 min-w-[100px] snap-start group"
                >
                  <div className={`h-16 w-16 rounded-3xl ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' : `${category.bg} ${category.color}`} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className={`text-sm font-bold ${isActive ? 'text-emerald-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Store Grid Section */}
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">
            {stores.length} {stores.length === 1 ? 'Result' : 'Results'} Found
          </h2>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stores.map((store) => {
                // Safely combine Area and Town to give a beautiful location string
                const locationParts = [store.area, store.town].filter(Boolean);
                const displayLocation = locationParts.length > 0 ? locationParts.join(", ") : "Online Store";

                return (
                  <Link key={store.id} href={`/${store.slug}`} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col">
                    <div className="h-36 bg-slate-100 relative w-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                      <img 
                        src={`https://source.unsplash.com/600x400/?shop,${store.name}`} 
                        alt="Store Cover" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {store.tier === 'VIP' && (
                        <div className="absolute top-3 right-3 z-20 bg-yellow-400 text-yellow-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Star className="h-3 w-3 fill-yellow-950" /> Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col relative pt-8">
                      {/* Floating Logo */}
                      <div className="absolute -top-8 left-5 h-16 w-16 bg-white rounded-2xl border-4 border-white shadow-md overflow-hidden flex items-center justify-center z-20">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-6 w-6 text-slate-300" />
                        )}
                      </div>

                      <h3 className="font-black text-lg text-slate-900 line-clamp-1">{store.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1 font-medium leading-relaxed">
                        {store.description || "Discover amazing products and deals at our store."}
                      </p>
                      
                      <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 w-fit px-3 py-1.5 rounded-xl border border-slate-100">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="truncate max-w-[200px]">{displayLocation}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">No stores found</h3>
              <p className="text-slate-500 mt-2">We couldn't find anything matching your search in that area.</p>
              <Link href="/" className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all">
                <XCircle className="h-5 w-5" /> Clear All Filters
              </Link>
            </div>
          )}
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white font-black text-2xl tracking-tight mb-4">
              <Store className="h-7 w-7 text-emerald-500" />
              LocalSoko
            </Link>
            <p className="text-sm max-w-sm mb-8 leading-relaxed font-medium">
              Empowering local businesses with smart POS systems and beautiful online storefronts. Connect with your community and shop local.
            </p>
            <p className="text-sm font-bold text-slate-600">© {new Date().getFullYear()} LocalSoko Inc. All rights reserved.</p>
          </div>
          <div>
            <h4 className="text-white font-black mb-6 uppercase tracking-wider text-sm">For Buyers</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">Browse Stores</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">How to Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black mb-6 uppercase tracking-wider text-sm">For Sellers</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/auth/login" className="hover:text-emerald-400 transition-colors">Open a Free Store</Link></li>
              <li><Link href="/auth/login" className="hover:text-emerald-400 transition-colors">POS Hardware</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}