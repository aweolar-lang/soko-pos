import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    
    // Initialize secure Supabase client
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

    // 1. Verify the seller is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract data from the Settings page request
    const body = await req.json();
    const { mpesaNumber, storeName } = body;

    if (!mpesaNumber) {
      return NextResponse.json({ error: "M-Pesa or Till number is required" }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Missing Paystack Secret Key in environment variables.");
    }

    // 3. Ping Paystack to create the Automated Subaccount
    // Note: For Kenyan M-Pesa, the settlement_bank parameter is typically "M-Pesa" or "M-Pesa (Safaricom)"
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: storeName || "LocalSoko Vendor",
        settlement_bank: "M-Pesa", 
        account_number: mpesaNumber, 
        percentage_charge: 1, // YOUR PLATFORM COMMISSION (e.g., 5%)
        description: `Automated Subaccount for ${storeName}`
      }),
    });

    const paystackData = await paystackRes.json();

    // 4. Handle Paystack Rejections (e.g., invalid phone format)
    if (!paystackData.status) {
      console.error("Paystack Subaccount Error:", paystackData.message);
      return NextResponse.json({ 
        error: "Paystack could not verify this number. Please check the format." 
      }, { status: 502 });
    }

    const subaccountCode = paystackData.data.subaccount_code;

    // 5. Save the generated subaccount_code to the seller's store in Supabase
    const { error: dbError } = await supabase
      .from("stores")
      .update({ paystack_subaccount_code: subaccountCode })
      .eq("owner_id", session.user.id);

    if (dbError) {
      console.error("Supabase Database Error:", dbError);
      throw dbError;
    }

    // 6. Return the success signal to the frontend
    return NextResponse.json({ 
      success: true, 
      subaccount_code: subaccountCode 
    });

  } catch (error: any) {
    console.error("Payout Setup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}