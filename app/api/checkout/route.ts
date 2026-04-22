import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, buyerName, buyerEmail, buyerPhone, fulfillmentType, takeawayTime, customerNotes } = body;

    if (!productId || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // UPDATE: We now also select 'stores(paystack_subaccount_code)'
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id, 
        title, 
        price, 
        store_id,
        stores ( paystack_subaccount_code )
      `) 
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Extract the subaccount code from the joined stores table
    // @ts-ignore - Supabase join typing workaround
    const subaccountCode = product.stores?.paystack_subaccount_code;

    const paystackPayload: any = {
      email: buyerEmail,
      amount: Math.round(product.price * 100),
      currency: "KES",
      callback_url: "https://localsoko.com/order-success", 
      // NEW: Add the subaccount code so Paystack splits the money automatically!
      subaccount: subaccountCode || undefined, 
      metadata: {
        product_id: product.id,
        store_id: product.store_id,
        custom_fields: [
          { display_name: "Buyer Name", variable_name: "buyer_name", value: buyerName },
          { display_name: "Buyer Phone", variable_name: "buyer_phone", value: buyerPhone || "N/A" },
          { display_name: "Fulfillment Type", variable_name: "fulfillment_type", value: fulfillmentType },
          { display_name: "Takeaway Time", variable_name: "takeaway_time", value: takeawayTime || "N/A" },
          { display_name: "Customer Notes", variable_name: "customer_notes", value: customerNotes || "N/A" }
        ],
      },
    };

    if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Paystack secret key missing.");

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: "Payment gateway rejected the request." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: paystackData.data.authorization_url });

  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}