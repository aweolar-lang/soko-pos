import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingBag, ShieldCheck, Truck } from "lucide-react";
import OrderModal from "../OrderModal";

export default async function ProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ store_slug: string; product_id: string }> 
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

  // 1. Fetch the Store (to get store ID, tier, and check if it's a hotel)
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, description, tier")
    .eq("slug", resolvedParams.store_slug)
    .single();

  if (storeError || !store) notFound();

  // 2. Fetch the specific Product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", resolvedParams.product_id)
    .single();

  if (productError || !product) notFound();

  const isHotel = store.description?.toLowerCase().includes("hotel") || store.description?.toLowerCase().includes("restaurant");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link 
            href={`/${resolvedParams.store_slug}`}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to {store.name}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Product Image */}
          <div className="w-full md:w-1/2 bg-slate-100 aspect-square md:aspect-auto relative flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.title} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <ShoppingBag className="h-20 w-20 text-slate-300" />
            )}
          </div>

          {/* Right Side: Product Details & Checkout */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
              <ShieldCheck className="h-4 w-4" /> Secure Payment
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2 mb-4">
              {product.title}
            </h1>
            
            <div className="text-4xl font-black text-slate-900 mb-8">
              Ksh {product.price.toLocaleString()}
            </div>

            <div className="prose prose-slate mb-8 flex-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-600 leading-relaxed">
                {product.description || "The seller has not provided a detailed description for this item."}
              </p>
            </div>

            <div className="space-y-4 mb-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Truck className="h-5 w-5 text-emerald-500" />
                {isHotel ? "Delivery or Takeaway available" : "Nationwide Shipping available"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Sold by <span className="font-bold text-slate-900">{store.name}</span>
              </div>
            </div>

            {/* Reusing your exact OrderModal! */}
            <div className="mt-auto">
              <OrderModal product={product} storeId={store.id} isHotel={isHotel} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}