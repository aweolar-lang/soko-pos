"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateBuyerPassword(formData: FormData) {
  const newPassword = formData.get("password") as string;
  
  // 1. Verify who is trying to do this by checking the secure cookie
  const cookieStore = await cookies();
  const buyerId = cookieStore.get("buyer_session")?.value;

  if (!buyerId) {
    return { error: "Security session expired. Please log in again." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "For your safety, the password must be at least 6 characters." };
  }

  try {
    // 2. Hash the new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update the database & remove the "requires_change" flag
    const { error } = await supabaseAdmin
      .from("buyers")
      .update({ 
        password_hash: hashedPassword,
        requires_password_change: false 
      })
      .eq("id", buyerId);

    if (error) {
      console.error("Password update error:", error);
      return { error: "Database error. Could not save your new password." };
    }

    return { success: true };
  } catch (err) {
    console.error("System Error:", err);
    return { error: "A system error occurred. Please try again later." };
  }
}