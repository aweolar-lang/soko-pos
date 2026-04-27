import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AdminSidebarUI from "./AdminSidebarUI";
import { ADMIN_EMAILS } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Initialize Supabase Server Client to securely read the login cookie
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

  // 2. Get the currently logged-in user
  const { data: { user } } = await supabase.auth.getUser();

  // 3. THE WHITELIST: Enter your two specific emails here that are allowed to access the admin panel. You can add more if needed.

  // 4. THE BOUNCER: Kick out anyone who isn't logged in, or whose email isn't on the list
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    console.warn(`Unauthorized access attempt to Admin Panel by: ${user?.email || 'Anonymous'}`);
    redirect("/"); // Instantly boots them back to the homepage
  }

  // 5. If they passed the check, let them in and load the UI!
  return <AdminSidebarUI>{children}</AdminSidebarUI>;
}