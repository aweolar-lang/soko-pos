import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VALID_PLANS = {
  "1_MONTH": 350,
  "6_MONTHS": 650,
  "1_YEAR": 1000,
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const user = session.user;
    const body = await req.json();
    const { plan, amount } = body;

    if (!plan || !amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const expectedAmount = VALID_PLANS[plan as keyof typeof VALID_PLANS];
    if (!expectedAmount || expectedAmount !== amount) {
      return NextResponse.json({ error: "Invalid plan or tampered amount detected." }, { status: 400 });
    }

    const paystackPayload = {
      email: user.email,
      amount: Math.round(amount * 100),
      currency: "KES",
      // Maps exactly to your payment-success page!
      callback_url: "https://localsoko.com/payment-success", 
      metadata: {
        custom_fields: [
          { display_name: "Payment Type", variable_name: "payment_type", value: "Platform Subscription" },
          { display_name: "Plan Selected", variable_name: "plan_selected", value: plan }
        ],
        transaction_type: "platform_subscription",
        owner_id: user.id,
        plan: plan,
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
    console.error("Billing API Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}