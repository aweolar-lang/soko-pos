import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MapPin, Clock, ShoppingBag, Utensils, Star } from "lucide-react";
import OrderModal from "./OrderModal";

// REMOVED: export const revalidate = 60; (Now the store updates instantly!)

export default async function StorefrontPage({ params }: { params: { store_slug: string } }) {
  const resolvedParams = await params; 
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, description, logo_url, county, town, area, tier")
    .eq("slug", resolvedParams.store_slug) 
    .single();

  if (storeError || !store) {
    notFound(); 
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const isHotel = store.description?.toLowerCase().includes("hotel") || store.description?.toLowerCase().includes("restaurant");
  const locationText = [store.area, store.town, store.county].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Store Banner */}
      <div className="relative w-full bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 pt-32 pb-16 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          {store.logo_url ? (
            <div className="h-28 w-28 rounded-full border-4 border-white overflow-hidden relative mb-5 shadow-2xl bg-white">
              <img src={store.logo_url} alt={`${store.name} logo`} className="object-cover h-full w-full" />
            </div>
          ) : (
            <div className="h-28 w-28 rounded-full border-4 border-white bg-slate-800 flex items-center justify-center mb-5 shadow-2xl">
              <ShoppingBag className="h-12 w-12 text-slate-400" />
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
            {store.name}
            {store.tier === 'VIP' && (
              <span title="VIP Verified Store" className="flex items-center bg-yellow-400/20 p-1.5 rounded-full">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </span>
            )}
          </h1>
          <p className="mt-4 text-lg text-emerald-50 max-w-2xl mx-auto font-medium leading-relaxed">
            {store.description || "Welcome to our official LocalSoko storefront."}
          </p>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center md:justify-start gap-8 text-sm font-bold text-slate-600">
          {locationText && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>{locationText}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span>Accepting Orders</span>
          </div>
          {isHotel && (
            <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-1.5 rounded-full shadow-sm">
              <Utensils className="h-4 w-4" />
              <span>Takeaway & Delivery Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
          {isHotel ? "Our Menu" : "Available Inventory"}
        </h2>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const displayImage = product.images && product.images.length > 0 ? product.images[0] : null;

              return (
                <div key={product.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                  <div className="relative h-56 w-full bg-slate-50 overflow-hidden">
                    {displayImage ? (
                      <img src={displayImage} alt={product.title} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 font-black px-4 py-1.5 rounded-full shadow-lg">
                      Ksh {product.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{product.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                      {product.description || "No description provided."}
                    </p>
                    <OrderModal product={product} storeId={store.id} isHotel={isHotel} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <ShoppingBag className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No items available</h3>
            <p className="text-slate-500 mt-2">This merchant hasn't uploaded any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}