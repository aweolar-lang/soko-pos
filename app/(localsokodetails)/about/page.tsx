import { Store, Users, Target, ShieldCheck, ArrowRight, Globe, FileDown, CreditCard, Smartphone, Zap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Header Section */}
      <div className="text-center pt-8">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-6 ring-4 ring-emerald-50/50">
          <Store className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          Empowering Commerce,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
            From Local to Global.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          LocalSoko is the ultimate all-in-one storefront for modern entrepreneurs. We make it incredibly simple to sell physical goods and digital products to anyone, anywhere.
        </p>
      </div>

      {/* Mission & Vision Grid */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-4">
            <Target className="h-7 w-7 text-emerald-600 bg-emerald-50 p-1.5 rounded-xl" /> 
            Our Mission
          </h3>
          <p className="text-slate-600 leading-relaxed font-medium text-lg">
            To tear down the technical barriers of e-commerce. We provide ambitious sellers with world-class digital storefronts, automated inventory, and secure payment routing, allowing them to focus entirely on what they do best: creating and selling.
          </p>
        </div>

        <div className="bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Globe className="h-32 w-32" />
          </div>
          <h3 className="text-2xl font-black flex items-center gap-3 mb-4 relative z-10">
            <Zap className="h-7 w-7 text-blue-400 bg-blue-400/10 p-1.5 rounded-xl" /> 
            Our Vision
          </h3>
          <p className="text-slate-300 leading-relaxed font-medium text-lg relative z-10">
            We envision a borderless marketplace where a local merchant in Nairobi can seamlessly sell an eBook to a buyer in New York, or deliver fresh produce to a neighbor down the street—all from one unified, beautiful dashboard.
          </p>
        </div>
      </div>

      {/* Core Features / Why LocalSoko */}
      <div className="pt-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900">Why build on LocalSoko?</h2>
          <p className="text-slate-500 mt-3 font-medium">Everything you need to run your business, built right in.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Multi-Currency</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Price your items in KES or USD. Accept payments via international credit cards or local mobile money seamlessly.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <FileDown className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Physical & Digital</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Ship physical inventory, offer local takeaway, or securely sell digital downloads with instant automated delivery.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <Smartphone className="h-6 w-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Smart Payouts</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Get paid instantly and directly. Automatically route your revenue straight to your M-Pesa Till or Global Bank Account.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-orange-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <ShieldCheck className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Bank-Grade Security</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every transaction is protected by industry-leading encryption and verified gateways, keeping buyers and sellers safe.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-[2.5rem] p-10 sm:p-16 text-center border border-slate-200">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Ready to launch your empire?</h2>
        <p className="text-slate-600 font-medium mb-8 max-w-xl mx-auto text-lg">
          Join the next generation of verified sellers building their storefronts on LocalSoko.
        </p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 text-lg">
          Start Selling Today <ArrowRight className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}