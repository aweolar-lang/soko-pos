import Link from "next/link";
import { CheckCircle2, Receipt, Home } from "lucide-react";
import { createClient } from "@supabase/supabase-js";


// It will always read the live URL and run the server code instantly.
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const reference = searchParams.reference;

  // If someone just types /order-success without a reference, stop them.
  if (!reference) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-800">Invalid Receipt</h1>
        <p className="text-slate-500">No transaction reference was provided.</p>
        <Link href="/" className="mt-4 text-emerald-600 font-bold underline">Go Home</Link>
      </div>
    );
  }

  // 3. THE MAGIC PING: Verify the transaction directly with Paystack
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      cache: "no-store", // Never cache the Paystack response
    });

    const verifyData = await verifyRes.json();

    // 4. DATABASE UPDATE: If payment is successful, update Supabase!
    if (verifyData.status && verifyData.data.status === "success") {
      const metadata = verifyData.data.metadata;

      // Make sure this is a store purchase and has a product_id
      if (metadata && metadata.product_id) {
        
        // CHECK: Has this order already been saved? (Prevents duplicates if the user refreshes the page)
        const { data: existingOrder } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("paystack_reference", reference)
          .single();

        // INSERT: If it doesn't exist, save it to the database right now!
        if (!existingOrder) {
          const getCustomField = (name: string) => 
            metadata.custom_fields?.find((f: any) => f.variable_name === name)?.value;

          await supabaseAdmin.from("orders").insert({
            buyer_name: getCustomField("buyer_name") || "N/A",
            buyer_email: verifyData.data.customer.email,
            buyer_phone: getCustomField("buyer_phone") || "N/A",
            fulfillment_type: getCustomField("fulfillment_type") || "SHIPPING",
            takeaway_time: getCustomField("takeaway_time"),
            customer_notes: getCustomField("customer_notes"),
            paystack_reference: reference,
            status: "PAID",
            product_id: metadata.product_id,
            quantity: 1,
            price_at_time: verifyData.data.amount / 100, // Convert back to KES
          });
          
          console.log(`✅ Order ${reference} successfully verified and saved!`);
        }
      }
    }
  } catch (error) {
    console.error("Failed to verify transaction on success page:", error);
    // We don't crash the page; we still show the receipt to the user.
  }

  // 5. THE UI: Render the beautiful receipt for the buyer
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Success Header Area */}
        <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Successful!</h1>
          <p className="text-emerald-50 mt-2 font-medium text-sm">
            The seller has received your order and is processing it now.
          </p>
        </div>

        {/* Order Details Area */}
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">
              <Receipt className="h-4 w-4" />
              Transaction Reference
            </div>
            <p className="font-mono text-slate-900 font-bold bg-white border border-slate-200 py-2 rounded-xl text-sm break-all">
              {reference}
            </p>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            A confirmation receipt has been sent to your email by Paystack. If you ordered takeaway, please head to the location at your selected time. 
          </p>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <Link 
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Home className="h-5 w-5" />
              Back to Homepage
            </Link>
            
            <p className="text-xs text-slate-400 font-medium pt-2">
              Powered by <span className="text-emerald-600 font-bold">LocalSoko</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}