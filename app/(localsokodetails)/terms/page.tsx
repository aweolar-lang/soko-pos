import { Scale, ShieldAlert, BadgeCheck, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
        <div className="bg-slate-900 p-3 rounded-2xl">
          <Scale className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500 font-bold">Standard Usage Agreement for LocalSoko Platforms</p>
        </div>
      </div>

      <div className="prose max-w-none text-slate-600 space-y-10 font-medium leading-relaxed">
        
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing LocalSoko or using the SokoPOS dashboard, you agree to be bound by these Terms of Service. LocalSoko provides a digital infrastructure (the "Platform") that connects independent Sellers with Buyers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">2. The Platform’s Role</h2>
          <p>
            LocalSoko is a venue. We are not a party to the transactions between Buyers and Sellers. We do not manufacture, store, or inspect the items sold through our storefronts. Consequently, LocalSoko is not responsible for the quality, safety, or legality of items advertised.
          </p>
        </section>

        {/* Prohibited Items Section from original file */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" /> 3. Prohibited Items & Conduct
          </h3>
          <p className="text-sm">Users are strictly prohibited from listing or selling:</p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm">
            <li className="flex gap-2"><span>•</span> Hazardous materials or regulated chemicals</li>
            <li className="flex gap-2"><span>•</span> Counterfeit goods or unauthorized replicas</li>
            <li className="flex gap-2"><span>•</span> Illegal substances or prescription drugs</li>
            <li className="flex gap-2"><span>•</span> Items that promote hate speech or violence</li>
          </ul>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">4. Subscriptions & Billing</h2>
          <p>
            Store owners may access premium features via a subscription (Monthly or 6-Month plans). All fees are non-refundable. Trial periods are limited to one per user, and LocalSoko reserves the right to terminate trials if we suspect account duplication.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">5. M-Pesa & Payment Safety</h2>
          <p>
            Sellers using SokoPOS or online storefronts are responsible for verifying M-Pesa transaction codes. LocalSoko is not liable for "Reversal Scams" or fraudulent payment messages. We strongly advise all sellers to follow the guidelines in our <strong>Safety Center</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">6. Content Licensing</h2>
          <p>
            By posting images or descriptions on LocalSoko, you grant us a non-exclusive, worldwide license to display and use that content for the purpose of promoting your store and the Platform.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            For legal inquiries, please contact <span className="font-bold text-slate-600 underline">legal@localsoko.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}