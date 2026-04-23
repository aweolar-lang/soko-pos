import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-8">
          <div className="bg-green-50 p-3 rounded-xl">
            <ShieldCheck className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mt-1">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed text-sm sm:text-base">
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              At LocalSoko (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our peer-to-peer marketplace services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect information that you provide directly to us when you use the Platform:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Data:</strong> When you register, we collect your email address, name, and securely stored authentication credentials (managed via Supabase).</li>
              <li><strong>Profile & Listing Data:</strong> When you post an item for sale, we collect the item details, photos, your phone number, and your general location (e.g., town or county) so buyers can reach you.</li>
              <li><strong>Automatically Collected Data:</strong> We may collect basic analytics data, such as IP addresses, browser types, and device information, to ensure the site runs smoothly and securely.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect primarily to provide and improve our marketplace. Specific uses include:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Facilitating communication between buyers and sellers (e.g., displaying your phone number and WhatsApp link on your active listings).</li>
              <li>Providing location-based search results so users can find items near them.</li>
              <li>Monitoring platform security, preventing fraud, and enforcing our Terms of Service.</li>
              <li>Sending account-related notifications, updates, or administrative messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Information Visibility & Sharing</h2>
            <p className="mb-3">
              <strong>Public Listings:</strong> Because LocalSoko is a public marketplace, any information you include in an item listing—including your provided phone number, general location, and item photos—will be publicly visible to anyone browsing the site. By posting an item, you consent to this public display.
            </p>
            <p>
              <strong>Third-Party Sharing:</strong> We do not sell, rent, or trade your personal information to third parties for their marketing purposes. We only share information with trusted service providers (like our database host, Supabase) who assist us in operating our platform securely. We may also disclose information if required by law or to respond to legal processes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure. You are responsible for keeping your auth credentials confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Data Rights & Deletion</h2>
            <p>
              You have the right to access, update, or delete the personal information we hold about you. You can edit or delete your individual listings at any time through your account dashboard. If you wish to permanently delete your entire account and all associated data, please contact us. Upon request, we will remove your active listings and scrub your personal data from our active databases.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please reach out to our privacy team:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg inline-block border border-gray-100">
              <span className="font-semibold text-green-700">privacy@localsoko.com</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}