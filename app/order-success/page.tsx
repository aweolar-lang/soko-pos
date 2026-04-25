import Link from "next/link";
import { CheckCircle2, PackageSearch, Home, AlertTriangle, Download } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }> | { reference?: string; trxref?: string };
}) {
  const resolvedParams = await searchParams;
  const reference = resolvedParams?.reference || resolvedParams?.trxref;

  // 1. NO REFERENCE
  if (!reference) {
    return <ErrorUI title="Missing Reference" message="No transaction reference found in the URL." />;
  }

  try {
    // 2. CHECK PAYSTACK (Verify the payment actually happened)
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status) {
      return <ErrorUI title="Paystack Error" message={`Paystack says: ${verifyData.message}`} />;
    }

    if (verifyData.data.status !== "success") {
      return <ErrorUI title="Payment Not Successful" message={`Transaction status is: ${verifyData.data.status}`} />;
    }

    // --- DYNAMIC CURRENCY FORMATTING ---
    const rawAmount = verifyData.data.amount / 100; // Paystack sends amounts in cents
    const currency = verifyData.data.currency || "KES"; // Defaults to KES if missing
    
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(rawAmount);

    // 3. CHECK METADATA
    const metadata = verifyData.data.metadata;
    if (!metadata) {
      return <ErrorUI title="Missing Metadata" message="Paystack returned no metadata for this transaction." />;
    }

    const customFields = metadata.custom_fields || [];
    const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;
    
    const productId = metadata.product_id || getField("product_id");
    
    // Check if it's a digital product
    const isDigital = metadata.is_digital === true || metadata.is_digital === "true";

    // 4. GENERATE SECURE DOWNLOAD URL FOR THE UI (If Digital)
    let downloadUrl: string | null = null;
    if (isDigital && productId) {
      const { data: prodData } = await supabaseAdmin
        .from("products")
        .select("file_url")
        .eq("id", productId)
        .single();

      if (prodData && prodData.file_url) {
        // Create a secure URL that expires in 24 hours just for this screen
        const { data: signedData } = await supabaseAdmin.storage
          .from("digital-products")
          .createSignedUrl(prodData.file_url, 86400);

        if (signedData?.signedUrl) {
          downloadUrl = signedData.signedUrl;
        }
      }
    }

    return <SuccessUI reference={reference} downloadUrl={downloadUrl} isDigital={isDigital} formattedTotal={formattedTotal} />;

  } catch (error: any) {
    return <ErrorUI title="Critical Code Crash" message={error.message || "Unknown error occurred"} />;
  }
}

// --- HELPER COMPONENTS ---

function ErrorUI({ title, message }: { title: string, message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-red-200 overflow-hidden text-center p-8">
        <div className="flex justify-center mb-4 text-red-500">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-sm font-mono text-slate-600 bg-red-50 p-4 rounded-xl border border-red-100 break-words">
          {message}
        </p>
        <Link href="/" className="mt-6 inline-block w-full bg-slate-900 text-white font-bold py-3 rounded-xl">
          Go Back
        </Link>
      </div>
    </div>
  );
}

function SuccessUI({ reference, downloadUrl, isDigital, formattedTotal }: { reference: string, downloadUrl?: string | null, isDigital?: boolean, formattedTotal: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden text-center">
        
        {/* HEADER: Displays the actual amount paid */}
        <div className="bg-emerald-600 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30 relative z-10">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-emerald-100 relative z-10 mb-1">Payment Successful</h1>
          <span className="text-4xl font-black text-white relative z-10 tracking-tight">{formattedTotal}</span>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Transaction Ref */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Transaction Ref</p>
            <p className="font-mono text-slate-900 font-bold bg-white border border-slate-200 py-2 rounded-xl text-sm break-all">
              {reference}
            </p>
          </div>
          
          {/* DIGITAL DOWNLOAD BUTTON */}
          {downloadUrl && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]">
                <Download className="h-5 w-5" /> Download Your File
              </a>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                A backup link has also been sent to your email.
              </p>
            </div>
          )}

          {/* PHYSICAL ITEM NOTICE */}
          {!isDigital && (
            <p className="text-sm text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
              The seller has been notified and your order is now being processed.
            </p>
          )}

          {/* NEW: THE AUTO-ACCOUNT HINT BOX */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-left">
             <span className="text-emerald-500 text-xl leading-none">💡</span>
             <div>
               <h4 className="text-sm font-bold text-emerald-800 mb-1">Account Auto-Created!</h4>
               <p className="text-[13px] text-emerald-700 font-medium leading-relaxed">
                 You can now track your purchases. Use the first <strong className="font-extrabold text-emerald-900">6 characters of your email</strong> as your temporary password.
               </p>
             </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link href="/" className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all">
              <Home className="h-4 w-4" /> Home
            </Link>
            {/* UPDATED: Now points to /track with a better icon and text */}
            <Link href="/track" className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md">
              <PackageSearch className="h-4 w-4" /> Track Order
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}