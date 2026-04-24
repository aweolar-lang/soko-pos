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
    // UPGRADE: Now accepts a payoutMethod ('MOBILE_MONEY' or 'BANK') and an optional bankCode
    const { payoutMethod = 'MOBILE_MONEY', accountNumber, bankCode, storeName } = body;

    if (!accountNumber) {
      return NextResponse.json({ error: "Account number is required" }, { status: 400 });
    }

    let finalAccountNumber = accountNumber;
    let paystackBankCode = "";

    // SCENARIO 1: Local Mobile Money (M-Pesa / Till)
    if (payoutMethod === 'MOBILE_MONEY') {
      // Remove spaces, dashes, and plus signs
      let cleanNumber = accountNumber.replace(/[\s+-]/g, '');
      
      // If it starts with 254, convert to 0
      if (cleanNumber.startsWith('254')) {
        cleanNumber = '0' + cleanNumber.substring(3);
      }

      // Smart Routing: Phone Number vs Till Number
      if (cleanNumber.length === 10) {
        paystackBankCode = "MPESA"; 
      } else if (cleanNumber.length >= 5 && cleanNumber.length <= 8) {
        paystackBankCode = "MPTILL"; 
      } else {
        return NextResponse.json({ 
          error: "Please enter a valid 10-digit phone number or a 5-8 digit Till number." 
        }, { status: 400 });
      }
      
      finalAccountNumber = cleanNumber;
    } 
    // SCENARIO 2: Global Bank Account
    else if (payoutMethod === 'BANK') {
      if (!bankCode) {
        return NextResponse.json({ error: "Bank Code is required for International Bank payouts." }, { status: 400 });
      }
      paystackBankCode = bankCode; // e.g., "044" for Access Bank Nigeria, or a US routing equivalent
      finalAccountNumber = accountNumber.replace(/[\s-]/g, ''); // clean any formatting
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
        settlement_bank: paystackBankCode, 
        account_number: finalAccountNumber, 
        percentage_charge: 1, 
        description: `Automated Subaccount for ${storeName}`
      }),
    });

    const paystackData = await paystackRes.json();

    // EXPOSE REAL ERROR
    if (!paystackData.status) {
      console.error("Paystack API Error:", paystackData.message);
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
