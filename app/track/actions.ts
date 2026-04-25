"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// We use the Service Role key so we can securely fetch from the buyers table
// without needing the user to already be authenticated.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function loginBuyer(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  try {
    // 1. Look for the buyer in the database
    const { data: buyer, error } = await supabaseAdmin
      .from("buyers")
      .select("*")
      .eq("email", email)
      .single();

    // 2. TRIGGER THE UI MODAL
    // Notice the word "find". The frontend checks for this word to trigger 
    // the "You must buy something first" popup!
    if (error || !buyer) {
      return { error: "We couldn't find an account for this email. Have you shopped with us yet?" };
    }

    // 3. Verify the password
    const isMatch = await bcrypt.compare(password, buyer.password_hash);
    
    if (!isMatch) {
      return { error: "Incorrect password. Hint: If it's your first time, check the lightbulb hint below!" };
    }

    // 4. Create the secure session
    // We use a secure, HTTP-only cookie so hackers/JavaScript can't steal it
    const cookieStore = await cookies();
    cookieStore.set("buyer_session", buyer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // Logged in for 1 week
      path: "/", // Available across the whole app
    });

    // 5. Tell the frontend exactly where to send them next
    return { 
      success: true, 
      requiresChange: buyer.requires_password_change 
    };

  } catch (err) {
    console.error("Login Error:", err);
    return { error: "A system error occurred. Please try again later." };
  }
}