import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// --- NEW FEATURE: Pricing for both currencies ---
const PRICING = {
  "1_MONTH": { KES: 350, USD: 4 },
  "6_MONTHS": { KES: 650, USD: 7 },
  "1_YEAR": { KES: 1000, USD: 10 },
} as const;

type PlanKey = keyof typeof PRICING;

function normalizePlan(value: unknown): PlanKey | null {
  if (typeof value !== "string") return null;
  const plan = value.trim().toUpperCase();
  return plan in PRICING ? (plan as PlanKey) : null;
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

    // --- NEW FEATURE: Fetch the store's currency ---
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("currency")
      .eq("owner_id", user.id)
      .single();

    // Default to KES if they don't have a currency set in the database yet
    const storeCurrency = (store?.currency || "KES") as "KES" | "USD";

    // --- NEW FEATURE: Get the dynamic amount based on plan AND currency ---
    const amount = PRICING[plan][storeCurrency];

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
      amount: Math.round(amount * 100),
      currency: storeCurrency,          
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
            display_name: `Amount (${storeCurrency})`,
            variable_name: "amount_paid",
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