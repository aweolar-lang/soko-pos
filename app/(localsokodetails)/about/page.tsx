import { Store, Users, Target, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-6">
          <Store className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">About LocalSoko</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
          We are building the most trusted and vibrant neighborhood marketplace in Kenya.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" /> Our Mission
          </h3>
          <p className="text-slate-600 leading-relaxed font-medium">
            To empower local entrepreneurs by providing a world-class digital storefront that is easy to use, secure, and deeply rooted in the community.
          </p>
        </div>

        <div className="space-y-6 text-slate-600">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" /> Why LocalSoko?
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="bg-slate-50 p-2 rounded-lg shrink-0 h-min border border-slate-100">
                <Store className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Hyper-Local</h4>
                <p className="text-sm mt-1">Discover items right in your backyard, reducing delivery costs and wait times.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="bg-slate-50 p-2 rounded-lg shrink-0 h-min border border-slate-100">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Verified Sellers</h4>
                <p className="text-sm mt-1">Every store is verified to ensure a safe and reliable shopping experience.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="pt-10 border-t border-slate-100 text-center">
        <p className="text-slate-900 font-bold mb-6">Ready to start your own neighborhood store?</p>
        <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
          Get Started Now <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}