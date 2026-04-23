import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-8">
          <div className="bg-green-50 p-3 rounded-xl">
            <Scale className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Terms of Service</h1>
            <p className="text-sm text-gray-500 mt-1">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed text-sm sm:text-base">
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing, registering for, or using LocalSoko (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, you may not access the Platform or use any of its services. We reserve the right to update or modify these Terms at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              LocalSoko acts solely as an online venue and peer-to-peer marketplace allowing users to offer, sell, and buy goods and services locally. <strong>We are not a party to the actual transaction between buyers and sellers.</strong> We do not hold inventory, process payments, or handle the delivery of items. Any agreement reached is solely between the buyer and the seller.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts & Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>You must be at least 18 years old to use this Platform.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate, current, and complete information during the registration process and when creating listings.</li>
              <li>You are solely responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Prohibited Items and Conduct</h2>
            <p className="mb-2">As a user, you agree NOT to post, sell, or buy any of the following items on LocalSoko:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Illegal drugs, narcotics, or related paraphernalia.</li>
              <li>Firearms, weapons, explosives, or ammunition.</li>
              <li>Stolen goods or counterfeit/fake merchandise.</li>
              <li>Adult content, pornography, or sexually explicit materials.</li>
              <li>Hazardous materials or strictly regulated chemicals.</li>
              <li>Any items that infringe on the intellectual property rights of third parties.</li>
            </ul>
            <p className="mt-3">
              Furthermore, you agree not to use the platform for scamming, phishing, harassment, or to distribute spam or malicious software.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Transactions & Disclaimers</h2>
            <p className="mb-2">Because LocalSoko is merely a venue, we cannot guarantee:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The truth or accuracy of user listings or ratings.</li>
              <li>The quality, safety, or legality of items advertised.</li>
              <li>The ability of sellers to sell items or the ability of buyers to pay for items.</li>
            </ul>
            <p className="mt-3 font-semibold text-gray-900">
              You agree to bear all risks associated with your transactions on the Platform. We strongly advise users to meet in safe, public locations and to thoroughly inspect items before making any payments (e.g., via Cash or M-Pesa).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, LocalSoko and its developers, officers, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform, including but not limited to loss of money, goodwill, reputation, or data. You agree that any dispute you have with another user is directly between you and that user, and you release LocalSoko from any claims or damages arising out of such disputes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Content & Intellectual Property</h2>
            <p>
              By posting content (images, descriptions) on LocalSoko, you grant us a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute that content for the purposes of operating and promoting the Platform. We reserve the right to remove any content or listing at our sole discretion, without notice, if we believe it violates these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Account Termination</h2>
            <p>
              We reserve the right, at our sole discretion, to suspend or terminate your account and access to the Platform at any time, for any reason, including but not limited to a violation of these Terms of Service or suspicious, fraudulent, or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions, concerns, or reports of violations regarding these Terms of Service, please contact our support team at:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg inline-block border border-gray-100">
              <span className="font-semibold text-green-700">legal@localsoko.com</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}