import Link from "next/link";
import { ArrowLeft, ShieldAlert, MapPin, Eye, CreditCard, AlertTriangle, UserCheck } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-8">
          <div className="bg-orange-50 p-3 rounded-xl">
            <ShieldAlert className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Safety & Trust Center</h1>
            <p className="text-sm text-gray-500 mt-1">Protecting our LocalSoko Community</p>
          </div>
        </div>

        <div className="prose max-w-none text-gray-600 mb-10">
          <p className="text-lg leading-relaxed">
            LocalSoko is built on community trust. While most users are genuine neighbors looking to buy and sell, it is important to stay vigilant. Please read these essential safety guidelines before conducting any transactions.
          </p>
        </div>

        {/* Core Rules Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <MapPin className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">1. Meet in Public</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Always arrange to meet the buyer or seller in a busy, well-lit public location. Great spots include shopping malls, coffee shops, or near a local police station. <strong>Never</strong> go to a stranger&apos;s house or invite them to yours if you are alone.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <Eye className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">2. Inspect Everything</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Take your time to thoroughly examine the item before handing over any money. If you are buying a phone or laptop, turn it on, test the camera, check the battery, and ensure it isn&apos;t locked to an iCloud or Google account.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <CreditCard className="h-8 w-8 text-red-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">3. No Advance Payments</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>Never send money via M-Pesa or bank transfer before receiving the item.</strong> If a seller demands a &quot;commitment fee,&quot; &quot;booking fee,&quot; or &quot;delivery fee&quot; upfront, it is highly likely to be a scam. Pay only when the item is in your hands.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <UserCheck className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">4. Trust Your Instincts</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              If a deal looks too good to be true (like a brand new iPhone 15 for Ksh 20,000), it probably is. If the other person is rushing you, acting aggressively, or changing the meeting location at the last minute, cancel the deal and walk away.
            </p>
          </div>

        </div>

        {/* Warning Section */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Common Scams to Avoid</h2>
          </div>
          <ul className="space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">•</span>
              <div>
                <strong>The &quot;Delivery/Courier&quot; Scam:</strong> The seller claims they are far away and will send the item via a matatu or G4S, but they need you to pay for the delivery fee first. Once you send the fee, they block your number.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">•</span>
              <div>
                <strong>The Fake Payment Reversal:</strong> A buyer pays you via M-Pesa, shows you a fake message, or immediately calls Safaricom to reverse the transaction as you are walking away. Always wait for your own M-Pesa confirmation message and instantly transfer large amounts to your bank or M-Shwari.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">•</span>
              <div>
                <strong>The Sob Story:</strong> Someone asks you to lower the price or give them the item first because of a medical emergency or a stranded family member. Keep transactions strictly business.
              </div>
            </li>
          </ul>
        </div>

        {/* Reporting Section */}
        <div className="mt-10 border-t border-gray-100 pt-8 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Need to report a suspicious user?</h2>
          <p className="text-gray-600 mb-4">Help us keep LocalSoko safe by reporting fraudulent listings or behavior immediately.</p>
          <a href="mailto:safety@localsoko.com" className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors shadow-sm">
            Contact Safety Team
          </a>
        </div>

      </div>
    </div>
  );
}