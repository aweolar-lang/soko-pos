import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Define the valid plans to prevent frontend tampering
const VALID_PLANS = {
  "1_MONTH": 350,
  "6_MONTHS": 650,
  "1_YEAR": 1000,
};

export async function POST(req: Request) {
  try {
    // 1. Securely get the authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const user = session.user;

    // 2. Extract and validate incoming data
    const body = await req.json();
    const { plan, amount } = body;

    if (!plan || !amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 3. Security Check: Prevent price manipulation
    // We check if the plan exists in our VALID_PLANS object, and if the amount matches perfectly.
    const expectedAmount = VALID_PLANS[plan as keyof typeof VALID_PLANS];
    if (!expectedAmount || expectedAmount !== amount) {
      return NextResponse.json(
        { error: "Invalid plan or tampered amount detected." },
        { status: 400 }
      );
    }

    // 4. Prepare Paystack Payload
    // Convert Ksh to the lowest unit (cents/kobo)
    const amountInSmallestUnit = Math.round(amount * 100);

    const paystackPayload = {
      email: user.email,
      amount: amountInSmallestUnit,
      currency: "KES",
      callback_url: "https://localsoko.com/dashboard/billing/success", // We will build this success page next
      metadata: {
        custom_fields: [
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: "Platform Subscription",
          },
          {
            display_name: "Plan Selected",
            variable_name: "plan_selected",
            value: plan,
          }
        ],
        // Hidden metadata our webhook will use to update the database silently
        transaction_type: "platform_subscription",
        owner_id: user.id,
        plan: plan,
      },
    };

    // 5. Call Paystack API
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
      console.error("Paystack Subscription Error:", paystackData.message);
      return NextResponse.json(
        { error: "Payment gateway rejected the request." },
        { status: 502 }
      );
    }

    // 6. Return the secure checkout URL to the frontend
    return NextResponse.json({ 
      checkoutUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference 
    });

  } catch (error: any) {
    console.error("Billing System Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while processing the subscription." },
      { status: 500 }
    );
  }
}