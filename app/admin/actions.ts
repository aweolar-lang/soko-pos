"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. SECURITY: STRICT ADMIN VERIFICATION
// ==========================================
async function verifyAdmin() {
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

  const { data: { user } } = await supabase.auth.getUser();
  
  const ADMIN_EMAILS = [
    "denismutuginjagi@gmail.com", 
    "aweolar@gmail.com"
  ];

  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("UNAUTHORIZED: Critical security violation attempt blocked.");
  }
  
  return user;
}

// ==========================================
// 2. ACTION: ISSUE REFUND
// ==========================================
export async function processRefund(transactionReference: string, amount: number) {
  try {
    await verifyAdmin(); // 🔒 Lock it down

    // Call Paystack API to process the refund
    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: transactionReference,
        amount: Math.round(amount * 100), // Convert back to cents/kobo for Paystack
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Paystack rejected the refund request.");
    }

    // Refresh the refunds and money flow pages instantly
    revalidatePath("/admin/dashboard/refunds");
    revalidatePath("/admin/dashboard/transactions");

    return { success: true, message: "Refund initiated successfully!" };

  } catch (error: any) {
    console.error("Refund Action Error:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 3. ACTION: RESOLVE DISPUTE
// ==========================================
export async function resolveDispute(
  disputeId: string, 
  resolution: "merchant-accepted" | "declined", 
  message: string, 
  refundAmount?: number,
  uploadedFilename?: string
) {
  try {
    await verifyAdmin(); // 🔒 Lock it down

    const bodyData: any = {
      resolution,
      message,
    };

    if (resolution === "merchant-accepted") {
      // If accepting the dispute, you can specify how much to refund
      bodyData.refund_amount = refundAmount ? Math.round(refundAmount * 100) : undefined;
    } else {
      // If declining, you must provide evidence (e.g., a receipt you uploaded to Supabase)
      bodyData.uploaded_filename = uploadedFilename;
    }

    // Call Paystack API to resolve the dispute
    const response = await fetch(`https://api.paystack.co/dispute/resolve/${disputeId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Paystack rejected the dispute resolution.");
    }

    // Refresh the disputes page instantly
    revalidatePath("/admin/dashboard/disputes");

    return { success: true, message: "Dispute has been resolved!" };

  } catch (error: any) {
    console.error("Dispute Action Error:", error);
    return { success: false, error: error.message };
  }
}