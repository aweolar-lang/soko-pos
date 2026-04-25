import { createClient } from "@supabase/supabase-js";
import { Star, ShieldCheck, MessageCircle, PackageOpen, Store } from "lucide-react";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. ADD THIS TYPE: Tells TypeScript exactly what the joined data looks like
type StoreReview = {
  rating: number;
  comment: string | null;
  created_at: string;
  buyers: { name: string } | { name: string }[] | null; // Safely handle objects or arrays
};

export default async function StoreProfilePage({ params }: { params: { storeId: string } }) {
  const { data: store } = await supabase
    .from("stores")
    .select("name, description, overall_score, total_reviews, success_rate")
    .eq("id", params.storeId)
    .single();

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Store not found</h1>
          <p className="text-slate-500 mt-2">This store may have been removed or suspended.</p>
        </div>
      </div>
    );
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, buyers(name)")
    .eq("store_id", params.storeId)
    .order("created_at", { ascending: false });

  // 2. CAST THE REVIEWS: Apply our new type to the Supabase data
  const safeReviews = (reviews as unknown as StoreReview[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ----------------- STORE HEADER ----------------- */}
      <div className="bg-slate-900 pt-20 pb-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-black text-slate-900 shadow-xl mb-5 border-4 border-slate-800">
            {store.name.charAt(0).toUpperCase()}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center justify-center gap-2">
            {store.name} 
            {store.overall_score >= 4.0 && (
              <ShieldCheck className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8" aria-label="Highly Rated Seller" role="img" />
            )}
          </h1>
          
          <p className="text-slate-400 mt-3 max-w-lg text-sm sm:text-base leading-relaxed">
            {store.description || "A trusted seller on the LocalSoko marketplace."}
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px]">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Trust Score</p>
              <p className="text-white text-2xl font-black flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> 
                {store.overall_score ? store.overall_score.toFixed(2) : "3.00"}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px]">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Reviews</p>
              <p className="text-white text-2xl font-black">{store.total_reviews || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- FEEDBACK SECTION ----------------- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Verified Buyer Reviews</h2>
        </div>

        {safeReviews.length === 0 ? (
           <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
             <PackageOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg text-slate-900 font-bold">No reviews yet</h3>
             <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
               This store is waiting for its first rating. Once buyers complete their orders, their feedback will appear here.
             </p>
           </div>
        ) : (
          <div className="grid gap-4">
            {/* 3. USE safeReviews HERE INSTEAD OF reviews */}
            {safeReviews.map((review, i) => {
              // Extract the buyer's name safely using our new TS rules
              const buyerName = Array.isArray(review.buyers) 
                ? review.buyers[0]?.name 
                : review.buyers?.name || "Verified Buyer";

              return (
                <div key={i} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">
                        {buyerName}
                      </h4>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        {new Date(review.created_at).toLocaleDateString("en-KE", { 
                          day: 'numeric', 
                          month: "long", 
                          year: "numeric" 
                        })}
                      </p>
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
                    <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 italic">
                      "{review.comment}"
                    </p>
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