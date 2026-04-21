import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { 
  Store, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  Package,
  Globe,
  Star
} from "lucide-react";

// Revalidate the page every hour so new stores show up automatically
export const revalidate = 3600;

export default async function Home() {
  // Initialize Supabase to fetch public stores
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch up to 3 stores to feature on the landing page
  const { data: featuredStores } = await supabase
    .from("stores")
    .select("name, description, logo_url, tier")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200">
      
      {/* NAVBAR (Public) */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
            <Store className="h-6 w-6" />
            LocalSoko
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/login" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-8">
          <ShieldCheck className="h-4 w-4" /> Built for Kenyan Retailers & Restaurants
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Run your entire business from your phone.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate Point of Sale and inventory manager. Ring up cash sales in person, and get a free custom website to sell online effortlessly.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
            Start Selling Now <ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-sm">
            See How it Works
          </a>
        </div>
      </main>

      {/* DYNAMIC FEATURED STORES SECTION */}
      {featuredStores && featuredStores.length > 0 && (
        <section className="py-16 bg-slate-100 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Join these beautiful stores on LocalSoko</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredStores.map((store, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 border border-slate-200 mb-4 overflow-hidden flex items-center justify-center">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {store.name}
                    {store.tier === 'VIP' && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                    {store.description || "Discover amazing products at our store."}
                  </p>
                  <Link href={`/${store.name.toLowerCase().replace(/\s+/g, '-')}`} className="mt-4 text-emerald-600 font-bold text-sm hover:text-emerald-700">
                    Visit Store &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Everything you need to scale.</h2>
            <p className="text-slate-500 text-lg">Stop managing your business on paper. LocalSoko gives you enterprise-grade tools in an easy-to-use mobile app.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast POS</h3>
              <p className="text-slate-500 leading-relaxed">
                Tap to add products to the cart, apply taxes, and record cash or M-Pesa payments instantly while the customer is standing in front of you.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Free Public Storefront</h3>
              <p className="text-slate-500 leading-relaxed">
                Get a custom link (localsoko.com/your-shop). Buyers can browse your live inventory and place orders securely online.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-500 hover:shadow-lg transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Inventory Tracking</h3>
              <p className="text-slate-500 leading-relaxed">
                Never accidentally sell out-of-stock items again. Walk-in POS sales automatically deduct stock from your online storefront.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-emerald-900 text-center px-4">
        <h2 className="text-4xl font-black text-white mb-6">Ready to digitize your shop?</h2>
        <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto">Join smart sellers across the country who are managing their inventory and making more sales with LocalSoko.</p>
        <Link href="/auth/login" className="inline-flex items-center justify-center bg-white text-emerald-900 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:scale-105 active:scale-95">
          Create Your Free Store
        </Link>
      </section>
    </div>
  );
}