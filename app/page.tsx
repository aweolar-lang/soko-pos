import Link from "next/link";
import { 
  Store, 
  Smartphone, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard,
  Package,
  Globe
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200">
      
      {/* NAVBAR (Public) */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
            <Store className="h-6 w-6" />
            SokoPOS
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
          <ShieldCheck className="h-4 w-4" /> Built for Kenyan Retailers
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Run your entire shop from your phone.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate Point of Sale and inventory manager. Ring up cash sales in person, and get a free custom website to sell on Instagram and WhatsApp.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
            Start Selling Now <ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-sm">
            See How it Works
          </a>
        </div>

        {/* Dashboard Preview Image Placeholder */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10 h-full"></div>
          <div className="bg-white border border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <div className="h-3 w-3 rounded-full bg-amber-400"></div>
              <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
            </div>
            {/* You can replace this with a real screenshot of your /dashboard later */}
            <div className="h-[400px] md:h-[600px] w-full bg-slate-50 flex items-center justify-center text-slate-300 border-x border-slate-200">
              [SokoPOS Dashboard Screenshot]
            </div>
          </div>
        </div>
      </main>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Everything you need to scale.</h2>
            <p className="text-slate-500 text-lg">Stop managing your business on paper. SokoPOS gives you enterprise-grade tools in an easy-to-use mobile app.</p>
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
                Get a custom link (localsoko.com/your-shop). Buyers can browse your live inventory and place orders directly via WhatsApp.
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
        <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto">Join smart sellers across the country who are managing their inventory and making more sales with SokoPOS.</p>
        <Link href="/auth/login" className="inline-flex items-center justify-center bg-white text-emerald-900 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:scale-105 active:scale-95">
          Create Your Free Store
        </Link>
      </section>

    </div>
  );
}