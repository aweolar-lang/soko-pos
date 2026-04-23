import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, MapPin, ShieldCheck, Truck, AlertCircle, Store, FileDown } from "lucide-react";
import OrderModal from "../OrderModal";
import ProductGallery from "./ProductGallery";

export default async function ProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ store_slug: string; product_slug: string }> 
}) {
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

  // Added offers_delivery to the select query
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, description, tier, offers_delivery, category")
    .eq("slug", resolvedParams.store_slug)
    .single();

  if (storeError || !store) notFound();

  // Selects all fields, which now naturally includes is_digital
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("slug", resolvedParams.product_slug)
    .single();

  if (productError || !product) notFound();

  const isHotel = store.category === "Food & Beverage";

  // MAGIC FIX: Grab the array of images, or fallback to image_url, or return an empty array.
  const imagesList: string[] = product.images && product.images.length > 0 
    ? product.images 
    : (product.image_url ? [product.image_url] : []);

  // Out of Stock Check: Digital products are infinite, so they bypass this check
  const isOutOfStock = !product.is_digital && product.stock_quantity <= 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-emerald-500/30">
      
      {/* 1. FROSTED GLASS NAVIGATION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link 
            href={`/store/${resolvedParams.store_slug}`}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to {store.name}</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Mini Store Badge for Context */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Store className="h-4 w-4" />
            {store.name}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Added dynamic opacity if out of stock */}
        <div className={`bg-white rounded-[2rem] border border-slate-100/80 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${isOutOfStock ? 'opacity-90' : ''}`}>
          
          {/* Left Side: Image Gallery Component */}
          <div className={`w-full md:w-1/2 bg-slate-50 relative border-b md:border-b-0 md:border-r border-slate-100 aspect-square md:aspect-auto ${isOutOfStock ? 'grayscale-[0.4]' : ''}`}>
             
             {/* NEW: Digital Product Floating Badge */}
             {product.is_digital && (
               <div className="absolute top-4 left-4 z-20 bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 tracking-wider uppercase">
                 <FileDown className="h-4 w-4" /> Digital Product
               </div>
             )}

             <ProductGallery images={imagesList} title={product.title} />
             
             {/* Large Floating Out of Stock Badge over image on mobile */}
             {isOutOfStock && (
               <div className="absolute top-4 right-4 md:hidden bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider z-10">
                 Sold Out
               </div>
             )}
          </div>

          {/* Right Side: Product Details & Checkout */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col">
            
            {/* Status Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full uppercase tracking-wider border border-red-100">
                  <AlertCircle className="h-4 w-4" /> Out of Stock
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <ShieldCheck className="h-4 w-4" /> Secure Payment
                </div>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1 mb-3 line-clamp-3">
              {product.title}
            </h1>
            
            <div className={`text-3xl sm:text-4xl font-black mb-8 ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
              Ksh {product.price.toLocaleString()}
            </div>

            <div className="prose prose-slate mb-8 flex-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                Description
                <div className="h-px flex-1 bg-slate-100"></div>
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {product.description || "The seller has not provided a detailed description for this item."}
              </p>
            </div>

            <div className="space-y-4 mb-8 pt-6 border-t border-slate-100">
              
              {/* NEW: Conditional Badges based on product type and store settings */}
              {product.is_digital ? (
                <div className="flex items-center gap-3 text-sm text-blue-700 font-medium bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <FileDown className="h-5 w-5 text-blue-600 shrink-0" />
                  Instant Digital Download after payment
                </div>
              ) : store.offers_delivery ? (
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Truck className="h-5 w-5 text-emerald-500 shrink-0" />
                  {isHotel ? "Delivery or Takeaway available" : "Nationwide Shipping & Delivery available"}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
                  Pick up in-store only
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Store className="h-5 w-5 text-emerald-500 shrink-0" />
                Sold by <span className="font-bold text-slate-900">{store.name}</span>
              </div>
            </div>

            <div className="mt-auto">
              {isOutOfStock ? (
                <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-4 px-4 rounded-2xl text-center flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                  <AlertCircle className="h-5 w-5" />
                  Currently Unavailable
                </button>
              ) : (
                <div className="[&>button]:w-full [&>button]:py-4 [&>button]:rounded-2xl [&>button]:text-base [&>button]:font-bold [&>button]:shadow-md [&>button:active]:scale-[0.98] [&>button]:transition-all">
                  <OrderModal product={product} storeId={store.id} isHotel={isHotel} />
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}