import Link from "next/link";
import { CheckCircle2, Receipt, Home, AlertTriangle, Download } from "lucide-react";
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

    // NOTICE: All Supabase INSERT logic has been removed here! 
    // The Webhook handles database insertion securely in the background.

    return <SuccessUI reference={reference} downloadUrl={downloadUrl} isDigital={isDigital} />;

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

function SuccessUI({ reference, downloadUrl, isDigital }: { reference: string, downloadUrl?: string | null, isDigital?: boolean }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center">
        <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Successful!</h1>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="font-mono text-slate-900 font-bold bg-white border border-slate-200 py-2 rounded-xl text-sm break-all">
              {reference}
            </p>
          </div>
          
          {/* DIGITAL DOWNLOAD BUTTON */}
          {downloadUrl && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95">
                <Download className="h-5 w-5" /> Download Your File
              </a>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                A backup link has also been sent to your email.
              </p>
            </div>
          )}

          {/* PHYSICAL ITEM NOTICE */}
          {!isDigital && (
            <p className="text-sm text-slate-600 font-medium">
              The seller has been notified and your order is now being processed.
            </p>
          )}

          <Link href="/" className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl">
            <Home className="h-5 w-5" /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}