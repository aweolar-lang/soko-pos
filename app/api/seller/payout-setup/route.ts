import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type PayoutMethod = "MOBILE_MONEY" | "BANK";

function normalizeMobileMoneyNumber(input: string) {
  let clean = input.replace(/[\s+-]/g, "");

  // Convert Kenyan international format 2547XXXXXXXX -> 07XXXXXXXX
  if (clean.startsWith("254") && clean.length === 12) {
    clean = "0" + clean.slice(3);
  }

  return clean;
}

function normalizeBankAccountNumber(input: string) {
  return input.replace(/\D/g, "");
}

function resolveMobileMoneyBankCode(accountNumber: string) {
  const clean = normalizeMobileMoneyNumber(accountNumber);

  // Phone number: 10 digits, e.g. 07XXXXXXXX
  if (/^0\d{9}$/.test(clean)) {
    return { accountNumber: clean, bankCode: "MPESA" };
  }

  // Till/Paybill number: 5 to 8 digits
  if (/^\d{5,8}$/.test(clean)) {
    return { accountNumber: clean, bankCode: "MPTILL" };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

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
            } catch {
              // Safe to ignore in restricted Next.js contexts
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

    const payoutMethod = (body?.payoutMethod || "MOBILE_MONEY") as PayoutMethod;
    const accountNumber = body?.accountNumber;
    const bankCode = body?.bankCode;
    const storeName =
      typeof body?.storeName === "string" && body.storeName.trim()
        ? body.storeName.trim()
        : "LocalSoko Vendor";

    if (!accountNumber || typeof accountNumber !== "string") {
      return NextResponse.json(
        { error: "Account number is required." },
        { status: 400 }
      );
    }

    if (!["MOBILE_MONEY", "BANK"].includes(payoutMethod)) {
      return NextResponse.json(
        { error: "Invalid payout method selected." },
        { status: 400 }
      );
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment gateway configuration error." },
        { status: 500 }
      );
    }

    let finalAccountNumber = "";
    let paystackBankCode = "";

    if (payoutMethod === "MOBILE_MONEY") {
      const resolved = resolveMobileMoneyBankCode(accountNumber);

      if (!resolved) {
        return NextResponse.json(
          {
            error:
              "Enter a valid 10-digit mobile number (07XXXXXXXX) or a 5–8 digit Till/Paybill number.",
          },
          { status: 400 }
        );
      }

      finalAccountNumber = resolved.accountNumber;
      paystackBankCode = resolved.bankCode;
    } else if (payoutMethod === "BANK") {
      if (!bankCode || typeof bankCode !== "string") {
        return NextResponse.json(
          { error: "Bank code is required for bank payouts." },
          { status: 400 }
        );
      }

      finalAccountNumber = normalizeBankAccountNumber(accountNumber);

      if (!finalAccountNumber || finalAccountNumber.length < 6) {
        return NextResponse.json(
          { error: "Enter a valid bank account number." },
          { status: 400 }
        );
      }

      paystackBankCode = bankCode.trim();
    }

    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: storeName,
        settlement_bank: paystackBankCode,
        account_number: finalAccountNumber,
        percentage_charge: 2.5,
        description: `LocalSoko Subaccount for ${storeName}`,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData?.status) {
      const message =
        paystackData?.message || "Paystack rejected the subaccount request.";
      console.error("Paystack API Error:", message);

      return NextResponse.json(
        { error: `Paystack: ${message}` },
        { status: 502 }
      );
    }

    const subaccountCode = paystackData?.data?.subaccount_code;

    if (!subaccountCode) {
      return NextResponse.json(
        { error: "Subaccount was created, but no subaccount code was returned." },
        { status: 502 }
      );
    }

    const { error: dbError } = await supabase
      .from("stores")
      .update({
        payout_method: payoutMethod,
        payout_account_number: finalAccountNumber,
        payout_bank_code: paystackBankCode,
        paystack_subaccount_code: subaccountCode,
      })
      .eq("owner_id", user.id);

    if (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json(
        { error: "Failed to save payout details." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subaccount_code: subaccountCode,
    });
  } catch (error) {
    console.error("Payout Setup Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}