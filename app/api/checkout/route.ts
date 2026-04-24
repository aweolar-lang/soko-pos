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
      customerNotes,
    } = body;

    if (!productId || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // UPGRADE: Fetch the product, including the store's Paystack code AND the newly added currency column
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id, 
        title, 
        price, 
        is_digital,
        store_id,
        stores ( paystack_subaccount_code, currency )
      `)
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // @ts-ignore - Supabase join typing workaround
    const subaccountCode = product.stores?.paystack_subaccount_code;
    
    // UPGRADE: Securely extract currency from the database (fallback to KES just in case)
    // @ts-ignore
    const storeCurrency = product.stores?.currency || "KES";

    // Hardcoded base URL
    const baseUrl = "https://localsoko.com";

    // 2. Build the Paystack Payload
    const paystackPayload: any = {
      email: buyerEmail,
      amount: Math.round(product.price * 100),
      currency: storeCurrency, // UPGRADE: Pass the dynamic currency securely to Paystack
      callback_url: `${baseUrl}/order-success`,
      subaccount: subaccountCode || undefined,
      metadata: {
        product_id: product.id,
        store_id: product.store_id,
        is_digital: product.is_digital,
        store_currency: storeCurrency, // Optional: Passing it in metadata makes viewing transaction logs easier
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
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
