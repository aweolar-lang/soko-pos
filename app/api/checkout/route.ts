import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      productId, 
      buyerName, 
      buyerEmail, 
      buyerPhone, 
      fulfillmentType, 
      takeawayTime, 
      customerNotes 
    } = body;

    if (!productId || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Fetch the product from the database to get the REAL price and store_id
    // Security check: Never trust the frontend price!
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, store_id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // 2. Prepare Paystack Payload
    const amountInSmallestUnit = Math.round(product.price * 100); // KES to cents

    const paystackPayload = {
      email: buyerEmail,
      amount: amountInSmallestUnit,
      currency: "KES",
      // We will route them to a generic success page on your main domain after payment
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://localsoko.com'}/order-success`, 
      metadata: {
        // Hidden metadata our webhook will use to find the product and store
        product_id: product.id,
        store_id: product.store_id,
        // Custom fields show up nicely on the Paystack dashboard AND our webhook extracts them!
        custom_fields: [
          {
            display_name: "Buyer Name",
            variable_name: "buyer_name",
            value: buyerName,
          },
          {
            display_name: "Buyer Phone",
            variable_name: "buyer_phone",
            value: buyerPhone || "N/A",
          },
          {
            display_name: "Fulfillment Type",
            variable_name: "fulfillment_type",
            value: fulfillmentType,
          },
          {
            display_name: "Takeaway Time",
            variable_name: "takeaway_time",
            value: takeawayTime || "N/A",
          },
          {
            display_name: "Customer Notes / Address",
            variable_name: "customer_notes",
            value: customerNotes || "N/A",
          }
        ],
      },
    };

    // 3. Call Paystack API
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key is missing.");
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
      console.error("Paystack Error:", paystackData.message);
      return NextResponse.json({ error: "Payment gateway rejected the request." }, { status: 502 });
    }

    // 4. Return the checkout URL to the frontend OrderModal
    return NextResponse.json({ checkoutUrl: paystackData.data.authorization_url });

  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during checkout." },
      { status: 500 }
    );
  }
}