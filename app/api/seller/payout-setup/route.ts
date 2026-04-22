import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mpesaNumber, storeName } = body;

    if (!mpesaNumber) {
      return NextResponse.json({ error: "M-Pesa number is required" }, { status: 400 });
    }

   // --- UPDATED: SMART AUTO-FORMATTER ---
    // Remove spaces, dashes, and plus signs
    let cleanNumber = mpesaNumber.replace(/[\s+-]/g, '');
    
    // If it starts with 254, convert to 0
    if (cleanNumber.startsWith('254')) {
      cleanNumber = '0' + cleanNumber.substring(3);
    }

    // Smart Routing: Decide if it's a Phone Number or a Till Number
    let paystackBankCode = "";

    if (cleanNumber.length === 10) {
      paystackBankCode = "MPESA"; // Standard Safaricom Mobile Money
    } else if (cleanNumber.length >= 5 && cleanNumber.length <= 8) {
      paystackBankCode = "MPTILL"; // Business Till Number
    } else {
      return NextResponse.json({ 
        error: "Please enter a valid 10-digit phone number or a 5-8 digit Till number." 
      }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Missing Paystack Secret Key.");
    }

    // Ping Paystack to create the Subaccount
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: storeName || "LocalSoko Vendor",
        settlement_bank: paystackBankCode, // EXACT code Paystack expects (MPESA or MPTILL)
        account_number: cleanNumber, 
        percentage_charge: 1, 
        description: `Automated Subaccount for ${storeName}`
      }),
    });

    const paystackData = await paystackRes.json();

    // --- NEW: EXPOSE REAL ERROR ---
    if (!paystackData.status) {
      console.error("Paystack API Error:", paystackData.message);
      // We now pass the EXACT error message from Paystack to your frontend
      return NextResponse.json({ 
        error: `Paystack: ${paystackData.message}` 
      }, { status: 502 });
    }

    const subaccountCode = paystackData.data.subaccount_code;

    const { error: dbError } = await supabase
      .from("stores")
      .update({ paystack_subaccount_code: subaccountCode })
      .eq("owner_id", session.user.id);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      subaccount_code: subaccountCode 
    });

  } catch (error: any) {
    console.error("Payout Setup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}