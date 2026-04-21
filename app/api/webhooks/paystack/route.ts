import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Initialize Supabase with the SERVICE_ROLE_KEY (Master Key) 
// Never expose this key to the frontend!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get raw body and signature for security verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify the Webhook Signature
    // This proves the request actually came from Paystack and not a hacker
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Parse the verified payload
    const event = JSON.parse(rawBody);

    // 4. Handle successful payments
    if (event.event === "charge.success") {
      const metadata = event.data.metadata;

      // ---- SCENARIO A: Platform Subscription Payment ----
      if (metadata && metadata.transaction_type === "platform_subscription") {
        const userId = metadata.user_id;
        const plan = metadata.plan;
        
        // Calculate the new expiration date based on the plan
        const now = new Date();
        let addMonths = 0;
        let newTier = 'PREMIUM';

        if (plan === "1_MONTH") {
          addMonths = 1;
        } else if (plan === "6_MONTHS") {
          addMonths = 6;
        } else if (plan === "1_YEAR") {
          addMonths = 12;
          newTier = 'VIP'; // Reward annual subscribers with the VIP tier!
        }

        const newSubEndsAt = new Date(now.setMonth(now.getMonth() + addMonths));

        // Update the seller's store in the database
        const { error: updateError } = await supabaseAdmin
          .from("stores")
          .update({
            subscription_ends_at: newSubEndsAt.toISOString(),
            tier: newTier,
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Failed to update store subscription:", updateError);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        console.log(`Successfully upgraded user ${userId} to ${newTier} until ${newSubEndsAt}`);
      }
      
      // ---- SCENARIO B: Customer bought a product from a seller ----
      else if (metadata && metadata.product_id) {
        // ---- SCENARIO B: Customer bought a product from a seller ----
        console.log(`Processing order for product ${metadata.product_id} from store ${metadata.store_id}`);
        
        // 1. Extract buyer details from the Paystack custom_fields
        const customFields = metadata.custom_fields || [];
        const buyerNameField = customFields.find((f: any) => f.variable_name === "buyer_name");
        const buyerPhoneField = customFields.find((f: any) => f.variable_name === "buyer_phone");
        const fulfillmentTypeField = customFields.find((f: any) => f.variable_name === "fulfillment_type");
        const takeawayTimeField = customFields.find((f: any) => f.variable_name === "takeaway_time");

        const buyerName = buyerNameField ? buyerNameField.value : "Guest";
        const buyerPhone = buyerPhoneField ? buyerPhoneField.value : null;
        const fulfillmentType = fulfillmentTypeField ? fulfillmentTypeField.value : "SHIPPING";
        const takeawayTime = takeawayTimeField ? takeawayTimeField.value : null;

        // 2. Insert the main order into the 'orders' table
        const { data: newOrder, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert({
            store_id: metadata.store_id,
            paystack_reference: event.data.reference,
            customer_name: buyerName,
            customer_email: event.data.customer.email,
            customer_phone: buyerPhone,
            amount_paid: event.data.amount / 100, // Convert back to KES from cents
            fulfillment_type: fulfillmentType,
            takeaway_time: takeawayTime ? new Date(takeawayTime).toISOString() : null,
            status: 'NEW',
            // Since your original schema had product_id directly on the orders table:
            product_id: metadata.product_id 
          })
          .select()
          .single();

        if (orderError) {
          console.error("Failed to insert order:", orderError);
          return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
        }

        // 3. (Optional but recommended) If you are using the order_items table for carts:
        const { error: itemsError } = await supabaseAdmin
          .from("order_items")
          .insert({
            order_id: newOrder.id,
            product_id: metadata.product_id,
            quantity: 1, // Defaulting to 1 for this simple checkout flow
            price_at_time: event.data.amount / 100
          });

        if (itemsError) {
          console.error("Failed to insert order items:", itemsError);
          // We don't fail the whole webhook here since the main order succeeded, 
          // but we log it for debugging.
        }

        console.log(`Successfully created Order ${newOrder.id} for Store ${metadata.store_id}`);
      }
    }

    // Paystack requires a 200 OK response to know we received the event
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}