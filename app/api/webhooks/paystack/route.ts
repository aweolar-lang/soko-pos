import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Service role required to bypass RLS in the background
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const metadata = event.data.metadata;

      // ---- SCENARIO A: Platform Subscription ----
      if (metadata && metadata.transaction_type === "platform_subscription") {
        const userId = metadata.owner_id;
        const plan = metadata.plan;
        
        const now = new Date();
        let addMonths = plan === "1_MONTH" ? 1 : plan === "6_MONTHS" ? 6 : 12;
        let newTier = plan === "1_YEAR" ? 'VIP' : 'PREMIUM';

        const newSubEndsAt = new Date(now.setMonth(now.getMonth() + addMonths));

        await supabaseAdmin
          .from("stores")
          .update({
            subscription_ends_at: newSubEndsAt.toISOString(),
            tier: newTier,
          })
          .eq("owner_id", userId);
      }
      
      // ---- SCENARIO B: Customer bought a product ----
      else if (metadata && metadata.product_id) {
        const customFields = metadata.custom_fields || [];
        const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;

        const buyerName = getField("buyer_name") || "Guest";
        const buyerPhone = getField("buyer_phone") || null;
        const fulfillmentType = getField("fulfillment_type") || "SHIPPING";
        const rawTakeawayTime = getField("takeaway_time");

        // Safely parse time (e.g., "14:30") into an ISO timestamp
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
            console.error("Takeaway time parsing failed:", rawTakeawayTime);
          }
        }

        // Insert Order
        const { data: newOrder, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert({
            store_id: metadata.store_id,
            paystack_reference: event.data.reference,
            customer_name: buyerName,
            customer_email: event.data.customer.email,
            customer_phone: buyerPhone,
            amount_paid: event.data.amount / 100, 
            fulfillment_type: fulfillmentType,
            takeaway_time: formattedTakeawayTime,
            status: 'NEW',
            product_id: metadata.product_id 
          })
          .select()
          .single();

        if (!orderError && newOrder) {
          // Insert Order Item
          await supabaseAdmin
            .from("order_items")
            .insert({
              order_id: newOrder.id,
              product_id: metadata.product_id,
              quantity: 1, 
              price_at_time: event.data.amount / 100
            });
        }
      }

      else if (event.event === "transfer.success") {
        const transferData = event.data;
      
        // Paystack sends the subaccount/recipient info. We find the store that owns it.
        // Note: Depending on Paystack's exact transfer payload, the code might be inside 'recipient'
        const subaccountCode = transferData.recipient?.subaccount || transferData.subaccount?.subaccount_code;

        if (subaccountCode) {
          // Find the store linked to this subaccount
          const { data: store } = await supabaseAdmin
            .from("stores")
            .select("id")
            .eq("paystack_subaccount_code", subaccountCode)
            .single();

          if (store) {
            // Log the payout in the database!
            await supabaseAdmin
              .from("payouts")
              .insert({
                store_id: store.id,
                amount_paid: transferData.amount / 100, // Convert from Kobo/Cents to Ksh
                paystack_reference: transferData.reference,
                status: "COMPLETED"
              });
          }
        }
      }

    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}