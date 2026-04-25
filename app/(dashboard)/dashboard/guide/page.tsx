import React from "react";
import { 
  ShieldCheck, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  ArrowRight 
} from "lucide-react";

export default function PayoutGuidePage() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      {/* Header Section */}
      <div className="mb-8 sm:mb-10 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Understanding Your Wallet & Payouts
        </h1>
        <p className="text-slate-600 max-w-3xl text-sm sm:text-base leading-relaxed">
          We know how important cash flow is to your business. Our payment system is designed to be transparent, secure, and reliable. Here is how your earnings move from a customer's checkout cart directly to your M-Pesa or Bank account.
        </p>
      </div>

      {/* Balances Explained - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
        {/* Pending Balance Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-lg mb-1">Pending Balance</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                Money from recent sales. The customer has paid, and the funds are securely held in escrow. It remains here while the order is being fulfilled and delivered to ensure customer satisfaction.
              </p>
            </div>
          </div>
        </div>

        {/* Available Balance Card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg mb-1">Available Balance</h3>
              <p className="text-emerald-800 text-sm leading-relaxed">
                Money that has cleared the verification period. These funds are 100% yours and are queued for payout to your linked M-Pesa Till or Bank Account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The Timeline Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-10 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-500" />
          The Payout Timeline (T+3 Schedule)
        </h2>
        
        <div className="space-y-6 sm:space-y-0 sm:flex sm:items-start justify-between relative">
          {/* Desktop connecting line */}
          <div className="hidden sm:block absolute top-6 left-10 right-10 h-0.5 bg-slate-100 z-0"></div>

          {/* Step 1 */}
          <div className="relative z-10 flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center shrink-0">
              <span className="font-bold text-slate-600">Day 0</span>
            </div>
            <div className="sm:text-center mt-1 sm:mt-0">
              <h4 className="font-semibold text-slate-900">Checkout</h4>
              <p className="text-sm text-slate-500 mt-1">Customer pays. Funds appear in Pending Balance.</p>
            </div>
          </div>

          <ArrowRight className="hidden sm:block w-5 h-5 text-slate-300 mt-3 shrink-0" />

          {/* Step 2 */}
          <div className="relative z-10 flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-amber-100 border-4 border-white shadow-sm flex items-center justify-center text-amber-600 shrink-0">
              <span className="font-bold">Day 1-3</span>
            </div>
            <div className="sm:text-center mt-1 sm:mt-0">
              <h4 className="font-semibold text-slate-900">Verification</h4>
              <p className="text-sm text-slate-500 mt-1">Time for you to deliver, and the customer to receive.</p>
            </div>
          </div>

          <ArrowRight className="hidden sm:block w-5 h-5 text-slate-300 mt-3 shrink-0" />

          {/* Step 3 */}
          <div className="relative z-10 flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
              <span className="font-bold">Day 4</span>
            </div>
            <div className="sm:text-center mt-1 sm:mt-0">
              <h4 className="font-semibold text-slate-900">Clearance</h4>
              <p className="text-sm text-slate-500 mt-1">Funds move to Available and are queued for payout!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why the Hold & Disputes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Why the hold? */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            Why do we hold funds for 3 days?
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-sm">Builds massive buyer trust</strong>
                <span className="text-slate-600 text-sm">Customers spend more knowing their payment is protected until the item arrives.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-sm">Eliminates messy chargebacks</strong>
                <span className="text-slate-600 text-sm">Prevents banks from forcefully pulling money out of your actual bank account (avoiding penalty fees).</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-sm">Keeps the platform clean</strong>
                <span className="text-slate-600 text-sm">Discourages fraudsters, keeping our marketplace reputation high so legitimate sellers like you can thrive.</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Disputes & Tips */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              What if there is a dispute?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              If a customer reports an issue with their delivery within the 3-day window, the specific funds for that order will remain in your Pending Balance until the issue is resolved. Our support team will work with both parties fairly.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>💡 Pro Tip:</strong> The faster you ship your orders and the better you communicate with your customers, the smoother your payouts will be!
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}