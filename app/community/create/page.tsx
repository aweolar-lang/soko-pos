import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import CreatePostForm from "../../../components/CreatePostForm";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function CreateCommunityPostPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnTo=/community/create");
  }

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
    const { data: buyer } = await supabase
      .from("buyers")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (buyer?.name) {
      authorName = buyer.name;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 autoflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Post to Community
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Share an update, product drop, or review.
              </p>
            </div>
          </div>
        </div>

        <CreatePostForm
          authorId={user.id}
          authorType={authorType}
          authorName={authorName}
        />
      </div>
    </div>
  );
}