import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { MapPin, Clock, ShoppingBag, Utensils, Star, MessageCircle, Info, ArrowRight } from "lucide-react";
import OrderModal from "./OrderModal";

export default async function StorefrontPage({ params }: { params: Promise<{ store_slug: string }> | { store_slug: string } }) {
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
    .select("id, name, description, logo_url, county, town, area, tier, category" )
    .eq("slug", resolvedParams.store_slug) 
    .single();

  if (storeError || !store) notFound(); 

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const isHotel = store.description?.toLowerCase().includes("hotel") || store.description?.toLowerCase().includes("restaurant") || store.description?.toLowerCase().includes("cafe") || store.name?.toLowerCase().includes("hotel") || store.name?.toLowerCase().includes("restaurant") || store.name?.toLowerCase().includes("cafe") || store.category?.toLowerCase().includes("hotel") || store.category?.toLowerCase().includes("restaurant") || store.category?.toLowerCase().includes("cafe");
  const locationText = [store.area, store.town, store.county].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-emerald-500/30">
      
      {/* 1. NEW COMPACT & ELEGANT HEADER */}
      <div className="relative h-64 md:h-72 w-full bg-slate-900 overflow-hidden">
        {/* Abstract Cover Background */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-slate-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* STORE PROFILE INFO (Overlapping the header) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 z-10 mb-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 border border-white">
          
          {/* Logo */}
          <div className="shrink-0 h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-slate-50 -mt-16 md:-mt-20 relative z-20">
            {store.logo_url ? (
              <img src={store.logo_url} alt={`${store.name} logo`} className="object-cover h-full w-full" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-slate-300" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 text-center md:text-left mt-2 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                  {store.name}
                  {store.tier === 'VIP' && (
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                  )}
                </h1>
                <p className="text-slate-500 font-medium mt-1.5 flex items-center justify-center md:justify-start gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  {locationText || "Location unlisted"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 justify-center">
                <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-full text-sm font-bold text-slate-700 border border-slate-100">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  4.8 <span className="text-slate-400 font-medium">(120)</span>
                </div>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors px-5 py-2 rounded-full text-sm font-bold text-white shadow-md active:scale-95">
                  <MessageCircle className="h-4 w-4" /> Message
                </button>
              </div>
            </div>

            <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed text-sm md:text-base">
              {store.description || "Welcome to our official LocalSoko storefront. Browse our available items below."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. FROSTED GLASS STICKY NAV */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-bold text-slate-600">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4" />
            <span>Open & Accepting Orders</span>
          </div>
          {isHotel && (
            <div className="flex items-center gap-2 text-slate-500">
              <Utensils className="h-4 w-4" />
              <span>Takeaway & Delivery Available</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-500 ml-auto hidden md:flex">
            <Info className="h-4 w-4" />
            <span>100% Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* 3. PREMIUM PRODUCT GRID */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900">
            {isHotel ? "Featured Menu" : "Latest Inventory"}
          </h2>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => {
              const displayImage = product.images && product.images.length > 0 ? product.images[0] : (product.image_url || null);
              const isOutOfStock = product.stock_quantity <= 0;

              return (
                <div key={product.id} className={`bg-white rounded-[2rem] border border-slate-100/80 shadow-sm overflow-hidden flex flex-col group transition-all duration-300 ${isOutOfStock ? 'opacity-75' : 'hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1'}`}>
                  
                  {/* Image Section */}
                  <Link href={`/${resolvedParams.store_slug}/${product.slug}`} className="relative h-60 w-full bg-slate-50 overflow-hidden block">
                    {displayImage ? (
                      <img src={displayImage} alt={product.title} className={`object-cover h-full w-full transition-transform duration-700 ${isOutOfStock ? 'grayscale' : 'group-hover:scale-105'}`} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                        <ShoppingBag className="h-16 w-16" />
                      </div>
                    )}

                    {/* Overlay Gradient for Text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      {isOutOfStock ? (
                        <span className="bg-red-500/95 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                          Sold Out
                        </span>
                      ) : (
                        // Empty div to keep flexbox alignment if no left badge
                        <div></div> 
                      )}
                      
                      {/* Price Pill */}
                      <span className="bg-white/95 backdrop-blur-md text-slate-900 font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                        Ksh {product.price.toLocaleString()}
                      </span>
                    </div>
                  </Link>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <Link href={`/${resolvedParams.store_slug}/${product.slug}`} className="group/title">
                      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover/title:text-emerald-600 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1 leading-relaxed">
                      {product.description || "Freshly added to our catalog. Click to view details."}
                    </p>
                    
                    {/* The Action Button / OrderModal */}
                    <div className="pt-2">
                      {isOutOfStock ? (
                        <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-3.5 px-4 rounded-2xl text-center flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                          Unavailable
                        </button>
                      ) : (
                        <div className="[&>button]:w-full [&>button]:py-3.5 [&>button]:rounded-2xl [&>button]:font-bold [&>button]:shadow-md [&>button:active]:scale-[0.98] [&>button]:transition-all">
                           <OrderModal product={product} storeId={store.id} isHotel={isHotel} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-8">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No items available</h3>
            <p className="text-slate-500 mt-2 font-medium">This merchant hasn't stocked their digital shelves yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}