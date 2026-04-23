import Link from "next/link";
import { ArrowLeft, Store, Users, Target, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-green-50 rounded-full mb-6">
            <Store className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">About LocalSoko</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We are building the most trusted, vibrant, and hassle-free neighborhood marketplace in Kenya.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-12">
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Our Mission
              </h2>
              <p className="text-gray-600 leading-relaxed">
                LocalSoko was created with a simple idea: it shouldn&apos;t be hard to buy and sell things within your own community. We wanted to build a platform that strips away the middleman, cuts out the complex fees, and connects neighbors directly.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Community First
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Whether you are a university student selling your old laptop, a local artisan showcasing furniture, or a family clearing out the garage, LocalSoko gives you a free, beautiful storefront to reach people right in your own town.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Why Choose Us?</h3>
            
            <ul className="space-y-5">
              <li className="flex gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 shrink-0 h-min">
                  <Store className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Hyper-Local</h4>
                  <p className="text-sm text-gray-600 mt-1">Our smart location filters make sure you are seeing items right in your own backyard.</p>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 shrink-0 h-min">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Verified Sellers</h4>
                  <p className="text-sm text-gray-600 mt-1">We use a robust rating system to ensure you are dealing with trustworthy members of the community.</p>
                </div>
              </li>
            </ul>
          </div>
          
        </div>

        {/* Call to Action Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-900 font-semibold mb-4">Ready to clear some space or find a great deal?</p>
          <Link href="/sell" className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm">
            Start Selling Today
          </Link>
        </div>

      </div>
    </div>
  );
}