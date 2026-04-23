import Link from "next/link";
import { CheckCircle2, Receipt, Home, AlertTriangle } from "lucide-react";
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
    // 2. CHECK PAYSTACK
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

    // Sometimes frontend developers put store_id inside custom_fields instead of the root metadata object
    const customFields = metadata.custom_fields || [];
    const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;
    
    const productId = metadata.product_id || getField("product_id");
    const storeId = metadata.store_id || getField("store_id");

    if (!productId || !storeId) {
      return (
        <ErrorUI 
          title="Missing Product or Store ID" 
          message={`product_id: ${productId || "MISSING"}, store_id: ${storeId || "MISSING"}`} 
        />
      );
    }

    // 4. CHECK DATABASE - ALREADY EXISTS?
    const { data: existingOrder, error: checkError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("paystack_reference", reference)
      .single();

    if (existingOrder) {
      // It already saved successfully! We can show the normal success page here.
      return <SuccessUI reference={reference} />;
    }

    // 5. INSERT ORDER
    const rawTakeawayTime = getField("takeaway_time");
    let formattedTakeawayTime = null;
    if (rawTakeawayTime && rawTakeawayTime !== "N/A") {
      try {
        if (rawTakeawayTime.length === 5 && rawTakeawayTime.includes(":")) {
          const todayDate = new Date().toISOString().split('T')[0];
          formattedTakeawayTime = new Date(`${todayDate}T${rawTakeawayTime}:00Z`).toISOString();
        } else {
          formattedTakeawayTime = new Date(rawTakeawayTime).toISOString();
        }
      } catch (e) {
        // ignore time format error
      }
    }

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        store_id: storeId,
        paystack_reference: reference,
        customer_name: getField("buyer_name") || "Guest",
        customer_email: verifyData.data.customer.email,
        customer_phone: getField("buyer_phone") || null,
        amount_paid: verifyData.data.amount / 100,
        fulfillment_type: getField("fulfillment_type") || "SHIPPING",
        takeaway_time: formattedTakeawayTime,
        status: 'NEW',
        product_id: productId
      })
      .select()
      .single();

    if (orderError) {
      return <ErrorUI title="Supabase Insert Error (Orders)" message={orderError.message} />;
    }

    // 6. INSERT ORDER ITEMS
    if (newOrder) {
      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert({
          order_id: newOrder.id,
          product_id: productId,
          quantity: 1,
          price_at_time: verifyData.data.amount / 100
        });

      if (itemsError) {
        return <ErrorUI title="Supabase Insert Error (Items)" message={itemsError.message} />;
      }
    }

    // IF IT MAKES IT HERE, IT ACTUALLY WORKED.
    return <SuccessUI reference={reference} />;

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

function SuccessUI({ reference }: { reference: string }) {
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
          <Link href="/" className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl">
            <Home className="h-5 w-5" /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}