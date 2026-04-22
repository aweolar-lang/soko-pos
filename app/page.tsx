import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, MapPin, LayoutGrid, Coffee, Smartphone, Sofa, Shirt, ShoppingBag, XCircle, ChevronRight } from "lucide-react";
import MarketplaceSearch from "@/components/MarketplaceSearch";

export const revalidate = 0; 

const CATEGORIES = [
  { name: "Food & Cafe", icon: Coffee },
  { name: "Electronics", icon: Smartphone },
  { name: "Furniture", icon: Sofa },
  { name: "Fashion", icon: Shirt },
  { name: "Supermarket", icon: ShoppingBag },
  { name: "All Categories", icon: LayoutGrid },
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
    <div className="min-h-screen bg-white font-sans flex flex-col selection:bg-slate-200">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* INDUSTRIAL HERO SECTION */}
        <div className="mb-16 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Local commerce, unified.
          </h1>
          <p className="text-lg text-slate-600 mb-8 font-normal max-w-2xl">
            Discover verified merchants, real-time inventory, and localized storefronts. Engineered for modern retail.
          </p>
          
          <MarketplaceSearch 
            initialQuery={searchQuery} 
            initialLocation={locationQuery} 
            initialCategory={categoryQuery} 
          />
        </div>

        {/* REFINED CATEGORIES */}
        <div className="mb-12 border-b border-slate-200 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Directory Filters</h2>
            {(searchQuery || categoryQuery || locationQuery) && (
              <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                <XCircle className="h-4 w-4" /> Clear All
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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
                  className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors ${
                    isActive 
                      ? 'border-slate-900 bg-slate-900 text-white' 
                      : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ENTERPRISE STORE GRID */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Merchants ({stores.length})
            </h2>
          </div>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stores.map((store) => {
                const locationParts = [store.area, store.town].filter(Boolean);
                const displayLocation = locationParts.length > 0 ? locationParts.join(", ") : "Digital Merchant";

                return (
                  <Link key={store.id} href={`/${store.slug}`} className="group flex flex-col bg-white border border-slate-200 hover:border-slate-900 transition-colors h-full">
                    <div className="p-4 flex items-start justify-between border-b border-slate-100">
                      <div className="h-10 w-10 bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      {store.tier === 'VIP' && (
                        <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-base text-slate-900 line-clamp-1 mb-1">{store.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 flex-1 mb-4">
                        {store.description || "Retail storefront and point of sale."}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[150px]">{displayLocation}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-20 border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center">
              <Store className="h-8 w-8 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-900">No merchants found</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Adjust your search parameters to find local results.</p>
              <Link href="/" className="text-sm font-medium text-slate-900 hover:underline">
                Clear Filters
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}