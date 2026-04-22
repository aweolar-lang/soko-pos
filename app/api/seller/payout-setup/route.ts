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

    // --- NEW: AUTO-FORMATTER ---
    // Remove spaces, dashes, and plus signs
    let cleanNumber = mpesaNumber.replace(/[\s+-]/g, '');
    
    // If it starts with 254, convert to 0
    if (cleanNumber.startsWith('254')) {
      cleanNumber = '0' + cleanNumber.substring(3);
    }

    // Ensure it is exactly 10 digits
    if (cleanNumber.length !== 10) {
      return NextResponse.json({ 
        error: "Please enter a valid 10-digit phone number (e.g., 0712345678). Till numbers may not be supported by default." 
      }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Missing Paystack Secret Key.");
    }

    // Ping Paystack
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: storeName || "LocalSoko Vendor",
        settlement_bank: "M-Pesa", // Paystack Kenya's official bank name for M-Pesa
        account_number: cleanNumber, 
        percentage_charge: 5, 
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