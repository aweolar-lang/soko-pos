import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { MapPin, Clock, ShoppingBag, Utensils, Star, MessageCircle, Info, Search, BadgeCheck, Phone, Truck, FileDown } from "lucide-react";
import OrderModal from "./OrderModal";

export default async function StorefrontPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ store_slug: string }> | { store_slug: string };
  searchParams: Promise<{ q?: string }> | { q?: string };
}) {
  const resolvedParams = await params; 
  // We grab the search query from the URL if the user typed something
  const resolvedSearchParams = await searchParams;
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

  // UPGRADE: Added currency to the fetch list
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, description, logo_url, county, town, area, tier, category, owner_id, offers_delivery, currency" )
    .eq("slug", resolvedParams.store_slug) 
    .single();

  if (storeError || !store) notFound(); 

  // DYNAMIC CURRENCY LOGIC
  const storeCurrency = store.currency || "KES";
  const currencySymbol = storeCurrency === "USD" ? "$" : "Ksh ";

  let rawPhone = "";
  if (store.owner_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_number")
      .eq("id", store.owner_id)
      .single();
      
    if (profile?.phone_number) {
      rawPhone = profile.phone_number;
    }
  }
  
  // Initialize the product query
  let productQuery = supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id);

  // If there's a search term, filter the database!
  if (resolvedSearchParams?.q) {
    productQuery = productQuery.ilike('title', `%${resolvedSearchParams.q}%`);
  }

  const { data: rawProducts } = await productQuery.order("created_at", { ascending: false });

  const products = rawProducts?.sort((a, b) => {
    // Digital items bypass stock check for sorting
    const aInStock = (a.is_digital || a.stock_quantity > 0) ? 1 : 0;
    const bInStock = (b.is_digital || b.stock_quantity > 0) ? 1 : 0;
    // 1 (in stock) comes before 0 (out of stock)
    return bInStock - aInStock; 
  }) || [];

  const isHotel = store.category === "Food & Beverage";
  const locationText = [store.area, store.town, store.county].filter(Boolean).join(", ");
  
  // Format phone number for WhatsApp (remove spaces, ensure country code)
  const whatsappNumber = rawPhone ? rawPhone.replace(/\D/g, '') : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-emerald-500/30">
      
      {/* 1. SHRUNK HEADER: Much less dark space now */}
      <div className="relative h-40 md:h-52 w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-slate-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      {/* STORE PROFILE INFO */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 z-10 mb-6">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-5 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 border border-white">
          
          {/* Logo (Shrunk slightly for mobile) */}
          <div className="shrink-0 h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-white overflow-hidden shadow-md bg-slate-50 -mt-14 md:-mt-16 relative z-20">
            {store.logo_url ? (
              <img src={store.logo_url} alt={`${store.name} logo`} className="object-cover h-full w-full" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-slate-300" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 w-full text-center md:text-left mt-2 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-1.5">
                  {store.name}
                  {/* Verified Badge */}
                  <div title="Verified Store">
                    <BadgeCheck className="h-6 w-6 text-blue-500 fill-blue-50" />
                  </div>
                  {store.tier === 'VIP' && (
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                  )}
                </h1>
                <p className="text-slate-500 font-medium mt-1 text-sm md:text-base flex items-center justify-center md:justify-start gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  {locationText || "Location unlisted"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 justify-center w-full md:w-auto">
                {whatsappNumber ? (
                  <>
                    <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none flex justify-center items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald-200">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                    <a href={`tel:${whatsappNumber}`} className="flex-1 md:flex-none flex justify-center items-center gap-1.5 bg-slate-900 hover:bg-slate-800 transition-colors px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md">
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">No contact info</span>
                )}
              </div>
            </div>

            <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed text-sm md:text-base line-clamp-2 md:line-clamp-none">
              {store.description || "Welcome to our official LocalSoko storefront. Browse our available items below."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. FROSTED GLASS STICKY NAV WITH SEARCH */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status Badges */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" /> Open
            </div>
            {isHotel && (
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
                <Utensils className="h-3.5 w-3.5" /> Takeaway / Delivery
              </div>
            )}
            {/* Added Delivery Badge for non-hotel stores */}
            {store.offers_delivery && !isHotel && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
                <Truck className="h-3.5 w-3.5" /> Delivery Available
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form method="GET" action={`/${resolvedParams.store_slug}`} className="w-full sm:max-w-xs relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              name="q" 
              defaultValue={resolvedSearchParams?.q || ""}
              placeholder="Search store..." 
              className="w-full bg-slate-100/70 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" 
            />
          </form>

        </div>
      </div>

      {/* 3. PREMIUM PRODUCT GRID */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {resolvedSearchParams?.q && (
          <p className="mb-6 text-slate-600 font-medium">
            Showing results for <span className="text-slate-900 font-bold">"{resolvedSearchParams.q}"</span>
            <Link href={`/${resolvedParams.store_slug}`} className="text-emerald-600 hover:underline ml-2 text-sm">Clear search</Link>
          </p>
        )}

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              const displayImage = product.images && product.images.length > 0 ? product.images[0] : (product.image_url || null);
              
              // Digital items are never out of stock
              const isOutOfStock = !product.is_digital && product.stock_quantity <= 0;

              return (
                <div key={product.id} className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group transition-all duration-300 ${isOutOfStock ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1'}`}>
                  
                  {/* Image Section */}
                  <Link href={`/${resolvedParams.store_slug}/${product.slug}`} className="relative h-40 sm:h-52 w-full bg-slate-50 overflow-hidden block shrink-0">
                    {displayImage ? (
                      <img src={displayImage} alt={product.title} className="object-cover h-full w-full transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                        <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12" />
                      </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 right-2 sm:right-3 flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        {isOutOfStock && (
                          <span className="bg-red-500/95 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md shadow-sm uppercase tracking-wider w-fit">
                            Sold Out
                          </span>
                        )}
                        {product.is_digital && (
                          <span className="bg-blue-600/95 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1 w-fit">
                            <FileDown className="h-3 w-3" /> Digital
                          </span>
                        )}
                        {!isOutOfStock && !product.is_digital && (
                          <div></div>
                        )}
                      </div>
                      
                      {/* UPGRADE: Dynamic Price Pill */}
                      <span className="bg-white/95 backdrop-blur-md text-slate-900 text-xs sm:text-sm font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-sm border border-white/20">
                        {currencySymbol}{product.price.toLocaleString()}
                      </span>
                    </div>
                  </Link>

                  {/* Content Section */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col bg-white">
                    <Link href={`/${resolvedParams.store_slug}/${product.slug}`} className="group/title">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1 group-hover/title:text-emerald-600 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Food Rating (Only shows if it's a hotel) */}
                    {isHotel && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-slate-700">4.5</span>
                        <span className="text-xs text-slate-400">(24)</span>
                      </div>
                    )}
                    
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed hidden sm:block">
                      {product.description || "View product details."}
                    </p>
                    
                    {/* The Action Button / OrderModal */}
                    <div className="mt-auto pt-2">
                      {isOutOfStock ? (
                        <button disabled className="w-full bg-slate-100 text-slate-400 text-sm font-bold py-2.5 sm:py-3 px-4 rounded-xl text-center flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                          Unavailable
                        </button>
                      ) : (
                        <div className="[&>button]:w-full [&>button]:py-2.5 sm:[&>button]:py-3 [&>button]:rounded-xl [&>button]:text-sm [&>button]:font-bold [&>button]:shadow-sm [&>button:active]:scale-[0.98] [&>button]:transition-all">
                           {/* UPGRADE: Passing storeCurrency to the Modal! */}
                           <OrderModal product={product} storeId={store.id} isHotel={isHotel} storeCurrency={storeCurrency} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">No items found</h3>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium max-w-sm mx-auto">
              {resolvedSearchParams?.q 
                ? "Try searching for a different keyword or check your spelling." 
                : "This merchant hasn't stocked their digital shelves yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}