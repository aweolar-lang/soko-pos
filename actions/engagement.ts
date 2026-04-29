"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Secure Admin Client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Standard client for grabbing Auth state safely
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function toggleLike(postId: string) {
  try {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return { success: false, error: "Must be logged in to like" };

    // Check if like already exists
    const { data: existingLike } = await supabaseAdmin
      .from("community_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      await supabaseAdmin.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      // Like
      await supabaseAdmin.from("community_likes").insert([{ post_id: postId, user_id: user.id }]);
    }

    revalidatePath("/community");
    return { success: true };
  } catch (err) {
    console.error("Like error:", err);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function addComment(formData: FormData) {
  try {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return { success: false, error: "Must be logged in to comment" };

    const postId = formData.get("postId")?.toString();
    const content = formData.get("content")?.toString().trim();
    
    if (!postId || !content) return { success: false, error: "Missing content" };

    // Fetch the user's display name from your stores or buyers table
    let authorName = user.user_metadata?.full_name || "User";
    const { data: store } = await supabaseAdmin.from("stores").select("name").eq("owner_id", user.id).maybeSingle();
    if (store) authorName = store.name;

    const { error } = await supabaseAdmin.from("community_comments").insert([{
      post_id: postId,
      author_id: user.id,
      author_name: authorName,
      content: content
    }]);

    if (error) throw error;

    revalidatePath("/community");
    return { success: true };
  } catch (err) {
    console.error("Comment error:", err);
    return { success: false, error: "Failed to add comment" };
  }
}