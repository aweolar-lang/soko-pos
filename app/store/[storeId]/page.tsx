import { createClient } from "@supabase/supabase-js";
import { 
  Star, 
  ShieldCheck, 
  MessageCircle, 
  PackageOpen, 
  Store,
  TrendingUp
} from "lucide-react";
import { Metadata } from "next";

// UPGRADE 1: Use ISR (Incremental Static Regeneration) instead of force-dynamic.
// This caches the page on the Edge for 60 seconds, making it load instantly for buyers 
// and drastically reducing your Supabase database reads.
export const revalidate = 60; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StoreReview = {
  rating: number;
  comment: string | null;
  created_at: string;
  buyers: { name: string } | { name: string }[] | null;
};

// UPGRADE 2: Enhanced Metadata
export async function generateMetadata({ params }: { params: Promise<{ storeId: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const { data: store } = await supabase
    .from("stores")
    .select("name, description")
    .eq("id", resolvedParams.storeId)
    .maybeSingle();

  if (!store) {
    return { title: "Store Not Found | LocalSoko" };
  }

  return {
    title: `${store.name} | LocalSoko`,
    description: store.description || `Shop authentic products from ${store.name} on LocalSoko. Read verified buyer reviews and ratings.`,
    openGraph: {
      title: `${store.name} on LocalSoko`,
      description: store.description || `Shop authentic products from ${store.name} on LocalSoko.`,
      siteName: "LocalSoko",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${store.name} | LocalSoko`,
      description: store.description || `Shop authentic products from ${store.name} on LocalSoko.`,
    }
  };
}

export default async function StoreProfilePage({ params }: { params: Promise<{ storeId: string }> }) {
  const resolvedParams = await params;
  const storeId = resolvedParams.storeId;

  // Fetch Store Profile
  const { data: store } = await supabase
    .from("stores")
    .select("name, description, overall_score, total_reviews, success_rate")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store not found</h1>
          <p className="text-slate-500 mt-3 font-medium">This merchant profile may have been removed, suspended, or the URL is incorrect.</p>
        </div>
      </div>
    );
  }

  // Fetch Reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, buyers(name)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const safeReviews = (reviews as unknown as StoreReview[]) || [];
  
  // Safe defaults for display
  const trustScore = store.overall_score ? store.overall_score.toFixed(1) : "3.0";
  const reviewCount = store.total_reviews || 0;
  const successRate = store.success_rate ? `${Math.round(store.success_rate)}%` : "N/A";

  // UPGRADE 3: JSON-LD Structured Data for Google Rich Snippets (Stars in Google Search)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": store.name,
    "description": store.description || `Products and reviews for ${store.name} on LocalSoko.`,
    "aggregateRating": reviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": trustScore,
      "reviewCount": reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Inject SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ----------------- STORE HEADER ----------------- */}
      <div className="bg-slate-900 pt-20 pb-12 px-4 sm:px-6 relative overflow-hidden border-b-4 border-emerald-500">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-emerald-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-black text-slate-900 shadow-xl mb-5 border-4 border-slate-800">
            {store.name.charAt(0).toUpperCase()}
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-white flex items-center justify-center gap-3 tracking-tight">
            {store.name} 
            {Number(trustScore) >= 4.0 && (
              <ShieldCheck className="text-blue-400 w-7 h-7 sm:w-9 sm:h-9" aria-label="Highly Rated Seller" role="img" />
            )}
          </h1>
          
          <p className="text-slate-300 mt-4 max-w-xl text-sm sm:text-base font-medium leading-relaxed">
            {store.description || "A trusted merchant on the LocalSoko marketplace offering high-quality products and excellent service."}
          </p>
          
          {/* UPGRADE 4: Expanded Metrics Display */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 w-full max-w-2xl">
            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[110px]">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                Trust Score
              </p>
              <p className="text-white text-2xl sm:text-3xl font-black flex items-center gap-1.5">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400" /> 
                {trustScore}
              </p>
            </div>
            
            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[110px]">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                Verified Reviews
              </p>
              <p className="text-white text-2xl sm:text-3xl font-black">{reviewCount}</p>
            </div>

            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[110px]">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                Success Rate
              </p>
              <p className="text-emerald-400 text-2xl sm:text-3xl font-black flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                {successRate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- FEEDBACK SECTION ----------------- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buyer Reviews</h2>
            <p className="text-slate-500 text-sm font-medium">Feedback from customers who purchased from this store.</p>
          </div>
        </div>

        {safeReviews.length === 0 ? (
           <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <PackageOpen className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-xl text-slate-900 font-black">No reviews yet</h3>
             <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium">
               This store is waiting for its first rating. Once buyers complete their orders, their verified feedback will appear here.
             </p>
           </div>
        ) : (
          <div className="grid gap-4">
            {safeReviews.map((review, i) => {
              const buyerName = Array.isArray(review.buyers) 
                ? review.buyers[0]?.name 
                : review.buyers?.name || "Verified Buyer";

              return (
                <div key={i} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                        {buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {buyerName}
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Verified</span>
                        </h4>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          {new Date(review.created_at).toLocaleDateString("en-KE", { 
                            day: 'numeric', 
                            month: "short", 
                            year: "numeric" 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                      {[...Array(5)].map((_, index) => (
                        <Star 
                          key={index} 
                          className={`w-4 h-4 ${index < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                        />
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <div className="mt-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium italic">
                        "{review.comment}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}