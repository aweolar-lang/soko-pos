import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VALID_PLANS = {
  "1_MONTH": 350,
  "6_MONTHS": 650,
  "1_YEAR": 1000,
} as const;

type PlanKey = keyof typeof VALID_PLANS;

function normalizePlan(value: unknown): PlanKey | null {
  if (typeof value !== "string") return null;
  const plan = value.trim().toUpperCase();
  return plan in VALID_PLANS ? (plan as PlanKey) : null;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    // FIX 1: Complete Supabase SSR configuration to handle secure cookie refreshes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // This catch is necessary for Next.js when called in restricted server contexts
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const plan = normalizePlan(body?.plan);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    const amount = VALID_PLANS[plan];

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Payment configuration error." },
        { status: 500 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "User email is required for payment initialization." },
        { status: 400 }
      );
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key missing.");
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://localsoko.com";

    const paystackPayload = {
      email: user.email,
      amount: Math.round(amount * 100), // FIX 2: Prevents decimal crashes
      currency: "KES",
      callback_url: `${appUrl}/payment-success`,
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
          },
          {
            display_name: "Amount (KES)",
            variable_name: "amount_kes",
            value: amount,
          },
        ],
        transaction_type: "platform_subscription",
        owner_id: user.id,
        plan,
      },
    };

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData?.status) {
      const message =
        paystackData?.message || "Payment gateway rejected the request.";
      console.error("Paystack initialize error:", message);

      return NextResponse.json(
        { error: message },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error("Billing Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}