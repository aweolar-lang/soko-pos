"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// We use the Admin client because this action needs to bypass RLS 
// to safely calculate and update the store's math in the background.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitReview(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const rating = parseInt(formData.get("rating") as string);
  const comment = formData.get("comment") as string;

  // 1. Verify Buyer Identity via Cookies
  const cookieStore = await cookies();
  const buyerId = cookieStore.get("buyer_session")?.value;

   // ADD THESE LINES:

  if (!buyerId) {
    return { error: "You must be logged in to leave a review." };
  }
  if (!rating || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5 stars." };
  }


  
 

  try {
    // 2. Verify Order Eligibility 
    // (Must belong to the buyer AND be marked as completed/success)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, store_id, status")
      .eq("id", orderId)
      .eq("buyer_id", buyerId)
      .maybeSingle();

    if (orderError || !order) {
      console.log("1. The Order ID from the URL is:", orderId);
      console.log("2. The Buyer ID from the Cookie is:", buyerId);
      return { error: "Order not found." };
    }
    
    if (order.status !== "completed" && order.status !== "success") {
      return { error: "You can only review completed orders." };
    }

    // 3. Insert the Review
    // (The UNIQUE constraint on order_id in the DB prevents duplicate reviews)
    const { error: insertError } = await supabaseAdmin
      .from("reviews")
      .insert({
        store_id: order.store_id,
        buyer_id: buyerId,
        order_id: orderId,
        rating: rating,
        comment: comment.trim() || null
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "You have already reviewed this order." };
      }
      throw insertError;
    }

    // ==========================================
    // 4. RUN THE TRUST ALGORITHM MATH
    // ==========================================

    // A. Fetch all reviews for this store to get the new average
    const { data: allReviews } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("store_id", order.store_id);

    const totalReviews = allReviews?.length || 0;
    const totalRatingSum = allReviews?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
    const averageBuyerRating = totalReviews > 0 ? (totalRatingSum / totalReviews) : 0;

    // B. Fetch the store's current success rate (out of 10)
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("success_rate")
      .eq("id", order.store_id)
      .maybeSingle();

    const successRate = store?.success_rate ?? 10;

    // C. The Math: 70% weight to Buyer Rating, 30% weight to Platform Success
    let newOverallScore = 3.00; // Fallback medium rate
    
    if (totalReviews > 0) {
      // averageBuyerRating is out of 5
      // (successRate / 2) converts the 10-point scale to a 5-point scale
      newOverallScore = (averageBuyerRating * 0.7) + ((successRate / 2) * 0.3);
    } else {
      // If they have no reviews, penalize the starting 3.00 score if they have cancellations
      newOverallScore = 3.00 * (successRate / 10);
    }

    // D. Round strictly to 2 decimal places
    newOverallScore = Math.round(newOverallScore * 100) / 100;
    const finalBuyerRating = Math.round(averageBuyerRating * 100) / 100;

    // 5. Update the Store Profile with the new calculations
    await supabaseAdmin
      .from("stores")
      .update({
        buyer_rating: finalBuyerRating,
        total_reviews: totalReviews,
        overall_score: newOverallScore
      })
      .eq("id", order.store_id);

    return { success: true };

  } catch (error: any) {
    console.error("Trust Algorithm Error:", error);
    return { error: "A system error occurred while processing your review." };
  }
}