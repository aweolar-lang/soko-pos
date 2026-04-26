import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Package, Download, Clock, CheckCircle2, LogOut, FileText, Truck, AlertCircle, Star, Store } from "lucide-react";
import Link from "next/link";

// 1. Initialize Supabase Admin to safely bypass RLS for fetching
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. Inline Server Action for logging out securely
async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("buyer_session");
  redirect("/track");
}

export default async function BuyerDashboardPage() {
  // 3. Verify the user's session
  const cookieStore = await cookies();
  const buyerId = cookieStore.get("buyer_session")?.value;

  if (!buyerId) {
    redirect("/track"); // Kick them out if they aren't logged in
  }

  // 4. Fetch the Buyer's details (for personalized greeting and email-based order fetching)
  const { data: buyer } = await supabaseAdmin
    .from("buyers")
    .select("name, email")
    .eq("id", buyerId)
    .single();

  // 5. Fetch all their orders (UPDATED TO INCLUDE GUEST EMAILS)
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      amount_paid,
      status,
      created_at,
      store_id,
      items (
        title,
        is_digital,
        file_url
      ),
      reviews (
        id
      )
    `)
    .or(`buyer_id.eq.${buyerId},customer_email.eq.${buyer?.email}`) 
    .order("created_at", { ascending: false });

  const safeOrders = orders || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* ----------------- HEADER ----------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center rotate-3">
              <Package className="text-white w-5 h-5 -rotate-3" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-lg leading-none">My Soko</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Welcome back, {buyer?.name?.split(" ")[0] || "Shopper"}</p>
            </div>
          </div>

          <form action={logout}>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors active:scale-95">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900">Your Order History</h2>
          <p className="text-slate-500 mt-1">Track your deliveries and access your digital downloads.</p>
        </div>

        {safeOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No orders yet</h3>
            <p className="text-slate-500 mt-2 mb-6">When you buy items from LocalSoko, they will appear here.</p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders Grid */
          <div className="grid gap-4">
            {safeOrders.map((order) => {
              // Ensure we handle arrays or single item objects safely based on Supabase return type
              const item = Array.isArray(order.items) ? order.items[0] : order.items;
              const isCompleted = order.status === "completed" || order.status === "success";
              const isDigital = item?.is_digital;
              
              // NEW: Check if this specific order has a review yet
              const hasReviewed = order.reviews && Array.isArray(order.reviews) ? order.reviews.length > 0 : !!order.reviews;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDigital ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isDigital ? <FileText className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">
                        {item?.title || "Unknown Item"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="font-semibold text-slate-700 uppercase tracking-wide text-[11px]">
                          KES {order.amount_paid.toLocaleString()}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          {new Date(order.created_at).toLocaleDateString("en-KE", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-slate-300">•</span>
                        
                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px] uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px] uppercase">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 flex flex-col justify-end gap-2 border-t border-slate-100 sm:border-0 pt-4 sm:pt-0">
                    
                    {/* YOUR ORIGINAL DOWNLOAD/TRACK BUTTONS (Untouched) */}
                    {isDigital ? (
                      isCompleted ? (
                        <a 
                          href={item?.file_url || "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" /> Download
                        </a>
                      ) : (
                        <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-400 text-sm font-bold rounded-xl border border-slate-200 cursor-not-allowed">
                          <AlertCircle className="w-4 h-4" /> Payment Pending
                        </div>
                      )
                    ) : (
                      <button 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        <Package className="w-4 h-4" /> Track Delivery
                      </button>
                    )}

                    {/* NEW: THE REVIEW & STORE BUTTONS ROW */}
                    <div className="flex w-full gap-2 mt-1">
                      {isCompleted && !hasReviewed && (
                        <Link href={`/buyer/review/${order.id}`} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors">
                          <Star className="w-3 h-3" /> Rate Order
                        </Link>
                      )}
                      {hasReviewed && (
                        <div className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 text-slate-400 text-xs font-bold rounded-lg border border-slate-100">
                           <CheckCircle2 className="w-3 h-3" /> Rated
                        </div>
                      )}
                      <Link href={`/store/${order.store_id}`} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                        <Store className="w-3 h-3" /> Visit Store
                      </Link>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}