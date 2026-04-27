import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Needed to bypass RLS and create the pending order securely
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Extract buyer ID from cookies
    const cookieStore = await cookies();
    const currentBuyerId = cookieStore.get("buyer_session")?.value || null;

    const body = await req.json();
    const {
      storeId,
      items, // Array of { id, quantity }
      buyerName,
      buyerEmail,
      buyerPhone,
      fulfillmentType,
      takeawayTime,
      customerNotes,
    } = body;

    if (!storeId || !items || !items.length || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Missing required checkout fields." }, { status: 400 });
    }

    // 2. Fetch the Store details
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("paystack_subaccount_code, currency")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    // 3. SECURITY CHECK: Fetch legitimate product prices from the database
    const productIds = items.map((item: { id: string }) => item.id);
    
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, title, price, is_digital")
      .in("id", productIds)
      .eq("store_id", storeId);

    if (productsError || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ error: "One or more products could not be verified." }, { status: 404 });
    }

    // 4. Calculate the exact total securely
    let secureTotal = 0;
    let hasDigital = false;
    let hasPhysical = false;

    const validatedCartItems = items.map((cartItem: { id: string, quantity: number }) => {
      const dbProduct = dbProducts.find((p) => p.id === cartItem.id);
      if (!dbProduct) throw new Error(`Invalid product in cart: ${cartItem.id}`);

      if (dbProduct.is_digital) hasDigital = true;
      else hasPhysical = true;

      secureTotal += (dbProduct.price * cartItem.quantity);
      return { id: dbProduct.id, q: cartItem.quantity };
    });

    const storeCurrency = store.currency || "KES";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localsoko.com";

    // 5. CREATE YOUR PENDING ORDER FIRST
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        store_id: storeId,
        buyer_id: currentBuyerId, 
        amount_paid: secureTotal,
        currency: storeCurrency,
        status: 'PENDING',
        buyer_name: buyerName,    
        buyer_phone: buyerPhone,
      })
      .select('id')
      .single();

    if (orderError || !newOrder) {
      console.error("Order Creation Error:", orderError);
      return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
    }

    const myOwnOrderId = newOrder.id;

    // 6. Build the Paystack Payload
    const paystackPayload: any = {
      email: buyerEmail,
      amount: Math.round(secureTotal * 100), 
      currency: storeCurrency,
      callback_url: `${appUrl}/order-success?store_id=${storeId}`, 
      metadata: {
        transaction_type: "marketplace_cart_order",
        store_id: storeId,
        order_id: myOwnOrderId, // <-- YOUR ORDER ID IS BACK!
        has_digital: hasDigital,
        has_physical: hasPhysical,
        cart_items: JSON.stringify(validatedCartItems),
        custom_fields: [
          { display_name: "Buyer Name", variable_name: "buyer_name", value: buyerName },
          { display_name: "Buyer Phone", variable_name: "buyer_phone", value: buyerPhone || "N/A" },
          { display_name: "Fulfillment Type", variable_name: "fulfillment_type", value: fulfillmentType },
          { display_name: "Takeaway Time", variable_name: "takeaway_time", value: takeawayTime || "N/A" },
          { display_name: "Customer Notes", variable_name: "customer_notes", value: customerNotes || "N/A" }
        ],
      },
    };

    if (store.paystack_subaccount_code && store.paystack_subaccount_code.trim() !== "") {
      paystackPayload.subaccount = store.paystack_subaccount_code;
      paystackPayload.bearer = "subaccount"; 
    }

    if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Paystack secret key missing.");

    // 7. Initialize Paystack
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
      { error: error.message || "An internal server error occurred." },
      { status: 500 }
    );
  }
}