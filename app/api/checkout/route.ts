import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // Instantiate the Supabase client dynamically per-request to avoid cache poisoning
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const cookieStore = await cookies();
    const currentBuyerId = cookieStore.get("buyer_session")?.value || null;

    const body = await req.json();
    const {
      storeId,          // NEW: We need the store ID to route funds
      items,            // NEW: Array of { id, quantity }
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

    // 1. Fetch the Store details (for the Paystack subaccount & currency)
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("paystack_subaccount_code, currency")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    // 2. SECURITY CHECK: Fetch legitimate product data from the database
    const productIds = items.map((item: { id: string }) => item.id);
    
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, title, price, is_digital")
      .in("id", productIds)
      .eq("store_id", storeId); // Extra guard: ensure items actually belong to this store

    if (productsError || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ error: "One or more products could not be verified." }, { status: 404 });
    }

    // 3. Calculate the exact total and verify inventory types
    let secureTotal = 0;
    let hasDigital = false;
    let hasPhysical = false;

    // Create a clean array of validated items for our metadata
    const validatedCartItems = items.map((cartItem: { id: string, quantity: number }) => {
      const dbProduct = dbProducts.find((p) => p.id === cartItem.id);
      
      if (!dbProduct) {
        throw new Error(`Invalid product detected in cart: ${cartItem.id}`);
      }

      if (dbProduct.is_digital) hasDigital = true;
      else hasPhysical = true;

      // Safe math
      secureTotal += (dbProduct.price * cartItem.quantity);

      return {
        id: dbProduct.id,
        q: cartItem.quantity // Keeping keys short for Paystack metadata limits
      };
    });

    const storeCurrency = store.currency || "KES";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localsoko.com";

    // 4. Build the Paystack Payload
    const paystackPayload: any = {
      email: buyerEmail,
      amount: Math.round(secureTotal * 100),
      currency: storeCurrency,
      callback_url: `${appUrl}/order-success?store_id=${storeId}`, 
      metadata: {
        transaction_type: "marketplace_cart_order",
        store_id: storeId,
        has_digital: hasDigital,
        has_physical: hasPhysical,
        cart_items: JSON.stringify(validatedCartItems),
        buyer_id: currentBuyerId,
        custom_fields: [
          { display_name: "Buyer Name", variable_name: "buyer_name", value: buyerName },
          { display_name: "Buyer Phone", variable_name: "buyer_phone", value: buyerPhone || "N/A" },
          { display_name: "Fulfillment Type", variable_name: "fulfillment_type", value: fulfillmentType },
          { display_name: "Takeaway Time", variable_name: "takeaway_time", value: takeawayTime || "N/A" },
          { display_name: "Customer Notes", variable_name: "customer_notes", value: customerNotes || "N/A" }
        ],
      },
    };

    // 5. Route funds via Subaccount if it exists
    if (store.paystack_subaccount_code && store.paystack_subaccount_code.trim() !== "") {
      paystackPayload.subaccount = store.paystack_subaccount_code;
      paystackPayload.bearer = "subaccount"; 
    }

    if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Paystack secret key missing.");

    // 6. Initialize Paystack Transaction
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
      console.error("Paystack Gateway Error:", paystackData);
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