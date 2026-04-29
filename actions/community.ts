"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize the secure Supabase Admin Client
// We use the Service Role key here to safely bypass RLS during server execution
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createShoppablePost(formData: FormData) {
  try {
    // 1. Extract and sanitize inputs
    const content = formData.get("content")?.toString().trim();
    const imageUrl = formData.get("imageUrl")?.toString().trim() || null;
    const authorId = formData.get("authorId")?.toString();
    const authorType = formData.get("authorType")?.toString() as 'merchant' | 'buyer';
    const authorName = formData.get("authorName")?.toString().trim();
    const taggedProductsString = formData.get("taggedProducts")?.toString().trim();

    // 2. Validate required fields
    if (!content || !authorId || !authorType || !authorName) {
      return { 
        success: false, 
        error: "Missing required fields. Content, author ID, author type, and name are required." 
      };
    }

    if (authorType !== 'merchant' && authorType !== 'buyer') {
      return { 
        success: false, 
        error: "Invalid author type. Must be 'merchant' or 'buyer'." 
      };
    }

    // 3. Insert the main community post
    const { data: post, error: postError } = await supabaseAdmin
      .from("community_posts")
      .insert([{
        content,
        image_url: imageUrl, // This is your Cloudinary/UploadThing URL
        author_id: authorId,
        author_type: authorType,
        author_name: authorName
      }])
      .select("id")
      .single();

    if (postError || !post) {
      console.error("Supabase Post Error:", postError);
      return { success: false, error: "Failed to publish post. Please try again." };
    }

    // 4. Handle Shoppable Product Tags (if any exist)
    if (taggedProductsString) {
      // Split the comma-separated string and remove any empty strings
      const taggedProductIds = taggedProductsString.split(',').filter(id => id.trim() !== '');

      if (taggedProductIds.length > 0) {
        const tagsToInsert = taggedProductIds.map(productId => ({
          post_id: post.id,
          product_id: productId.trim()
        }));

        const { error: tagError } = await supabaseAdmin
          .from("post_product_tags")
          .insert(tagsToInsert);

        if (tagError) {
          // Note: We don't fail the whole post if tags fail, but we log it.
          console.error("Failed to link products to post:", tagError);
        }
      }
    }

    // 5. Revalidate the community feed cache
    // This ensures that the moment the post is saved, the public feed updates instantly.
    revalidatePath("/community");
    
    return { success: true, postId: post.id };

  } catch (err: any) {
    console.error("Server Action Exception:", err);
    return { success: false, error: "An unexpected error occurred while publishing." };
  }
}