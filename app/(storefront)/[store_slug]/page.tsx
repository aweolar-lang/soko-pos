import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Image from "next/image";
import { MapPin, Clock, ShoppingBag, Utensils, Star } from "lucide-react";
import OrderModal from "./OrderModal"; // We will build this client component next

// This tells Next.js to revalidate the page every 60 seconds so buyers see fresh inventory
export const revalidate = 60; 

export default async function StorefrontPage({ params }: { params: { storeSlug: string } }) {
  const cookieStore = await cookies();

  // Initialize Supabase with the ANON key for public reading
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

  // 1. Fetch the Store Details
  // Assuming your stores table has a 'slug' or 'name' column that matches the URL
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, description, logo_url, banner_url, tier")
    .ilike("name", params.storeSlug.replace(/-/g, " ")) // Basic fallback if using names as URLs
    .single();

  if (storeError || !store) {
    notFound(); // Triggers the Next.js 404 page if the store doesn't exist
  }

  // 2. Fetch the Store's Products/Dishes
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const isHotel = store.description?.toLowerCase().includes("hotel") || store.description?.toLowerCase().includes("restaurant");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Store Banner & Header */}
      <div className="relative h-64 md:h-80 w-full bg-slate-900 overflow-hidden">
        {store.banner_url ? (
          <Image 
            src={store.banner_url} 
            alt={`${store.name} banner`} 
            fill 
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-slate-900 opacity-90" />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {store.logo_url && (
            <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden relative mb-4 shadow-xl">
              <Image src={store.logo_url} alt={`${store.name} logo`} fill className="object-cover" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
            {store.name}
            {store.tier === 'VIP' && (
              <span title="VIP Verified Store" className="flex items-center">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </span>
            )}
          </h1>
          <p className="mt-3 text-lg text-slate-200 max-w-2xl mx-auto font-medium">
            {store.description || "Welcome to our online store."}
          </p>
        </div>
      </div>

      {/* 2. Store Info Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Nairobi, Kenya</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span>Open Now</span>
          </div>
          {isHotel && (
            <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full">
              <Utensils className="h-4 w-4" />
              <span>Accepting Takeaway & Delivery</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Product/Menu Grid */}
      <div className="max-w-5xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
          {isHotel ? "Our Menu" : "Available Products"}
        </h2>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col group">
                
                {/* Product Image */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-slate-900 font-black px-4 py-1.5 rounded-full shadow-lg">
                    Ksh {product.price}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                    {product.description || "No description available."}
                  </p>
                  
                  {/* This handles the Buy Button and the Takeaway/Delivery popup */}
                  <OrderModal product={product} storeId={store.id} isHotel={isHotel} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No items available</h3>
            <p className="text-slate-500">This seller hasn't added any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}