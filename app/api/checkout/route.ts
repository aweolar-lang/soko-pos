import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase for the server environment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Extract and validate incoming data
    const body = await req.json();
    const { productId, buyerEmail, buyerName, buyerPhone } = body;

    if (!productId || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required fields (Product ID and Email are required)." },
        { status: 400 }
      );
    }

    // 2. Fetch the product details securely from the database
    // We never trust the price sent from the frontend!
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, stores(id, name)")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found or unavailable." },
        { status: 404 }
      );
    }

    // 3. Prepare Paystack Payload
    // Paystack requires the amount to be in the lowest currency unit (Cents/Kobo/Pesewas)
    // For KES (Kenyan Shillings), we multiply the amount by 100
    const amountInSmallestUnit = Math.round(product.price * 100);

    const paystackPayload = {
      email: buyerEmail.trim(),
      amount: amountInSmallestUnit,
      currency: "KES",
      callback_url: "https://localsoko.com/payment-success",
      metadata: {
        custom_fields: [
          {
            display_name: "Buyer Name",
            variable_name: "buyer_name",
            value: buyerName || "Guest Buyer",
          },
          {
            display_name: "Buyer Phone",
            variable_name: "buyer_phone",
            value: buyerPhone || "N/A",
          }
        ],
        product_id: product.id,
        store_id: product.stores.id,
        store_name: product.stores.name,
      },
    };

    // 4. Call Paystack API
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key is not configured.");
    }

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
      console.error("Paystack API Error:", paystackData.message);
      return NextResponse.json(
        { error: "Payment gateway rejected the request." },
        { status: 502 }
      );
    }

    // 5. Return the secure checkout URL to the frontend
    return NextResponse.json({ 
      checkoutUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference 
    });

  } catch (error: any) {
    console.error("Checkout System Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while processing checkout." },
      { status: 500 }
    );
  }
}