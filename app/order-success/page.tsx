import Link from "next/link";
import { CheckCircle2, Receipt, Home } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }> | { reference?: string; trxref?: string };
}) {
  const resolvedParams = await searchParams;
  const reference = resolvedParams?.reference || resolvedParams?.trxref;

  if (reference) {
    try {
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        cache: "no-store", 
      });

      const verifyData = await verifyRes.json();

      if (verifyData.status && verifyData.data.status === "success") {
        const metadata = verifyData.data.metadata;

        // 🚨 ADDED CHECK FOR store_id!
        if (metadata && metadata.product_id && metadata.store_id) {
          const { data: existingOrder } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("paystack_reference", reference)
            .single();

          if (!existingOrder) {
            const customFields = metadata.custom_fields || [];
            const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;

            // Safely parse time just like we did in the webhook
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
                console.error("Time parsing failed");
              }
            }

            // 1. INSERT ORDER (With the missing store_id!)
            const { data: newOrder, error: orderError } = await supabaseAdmin
              .from("orders")
              .insert({
                store_id: metadata.store_id, // <-- This was missing!
                paystack_reference: reference,
                customer_name: getField("buyer_name") || "Guest",
                customer_email: verifyData.data.customer.email,
                customer_phone: getField("buyer_phone") || null,
                amount_paid: verifyData.data.amount / 100, 
                fulfillment_type: getField("fulfillment_type") || "SHIPPING",
                takeaway_time: formattedTakeawayTime,
                status: 'NEW',
                product_id: metadata.product_id 
              })
              .select()
              .single();

            if (orderError) console.error("🚨 Order Insert Error:", orderError);

            // 2. INSERT ORDER ITEMS
            if (!orderError && newOrder) {
              const { error: itemsError } = await supabaseAdmin
                .from("order_items")
                .insert({
                  order_id: newOrder.id,
                  product_id: metadata.product_id,
                  quantity: 1, 
                  price_at_time: verifyData.data.amount / 100
                });

              if (itemsError) console.error("🚨 Items Insert Error:", itemsError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to verify transaction on success page:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Successful!</h1>
          <p className="text-emerald-50 mt-2 font-medium text-sm">
            The seller has received your order and is processing it now.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">
              <Receipt className="h-4 w-4" />
              Transaction Reference
            </div>
            <p className="font-mono text-slate-900 font-bold bg-white border border-slate-200 py-2 rounded-xl text-sm break-all">
              {reference || "Sent via Email"}
            </p>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            A confirmation receipt has been sent to your email by Paystack. If you ordered takeaway, please head to the location at your selected time. 
          </p>

          <div className="pt-4 space-y-3">
            <Link 
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Home className="h-5 w-5" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}