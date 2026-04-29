import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import CreatePostForm from "../../../components/CreatePostForm";
import { toast } from "sonner";

// 1. Secure Server-Side Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CreateCommunityPostPage() {
  // 2. Get the currently authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If they aren't logged in, send them to login
  if (authError || !user) {
    //toast.error("You must be logged in to post to the community.");
    redirect("/login");
  }

  // 3. Determine if they are a Merchant or a Buyer
  // We check the stores table first. If they own a store, they post as a merchant.
  let authorType: "merchant" | "buyer" = "buyer";
  let authorName = user.user_metadata?.full_name || "Anonymous Buyer";

  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (store) {
    authorType = "merchant";
    authorName = store.name;
  } else {
    // Optional: Fetch buyer specific details if needed
    const { data: buyer } = await supabase
      .from("buyers")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (buyer && buyer.name) {
      authorName = buyer.name;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div>
          <Link 
            href="/community" 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Megaphone className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Post to Community</h1>
              <p className="text-slate-500 font-medium mt-1">Share an update, product drop, or review.</p>
            </div>
          </div>
        </div>

        {/* RENDER THE CLIENT FORM */}
        {/* We pass the secure server-fetched data down to the interactive client component */}
        <CreatePostForm 
          authorId={user.id} 
          authorType={authorType} 
          authorName={authorName} 
        />
        
      </div>
    </div>
  );
}