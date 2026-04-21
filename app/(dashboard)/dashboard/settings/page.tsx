"use client";

import { useState, useEffect } from "react";
import { Store, Link as LinkIcon, Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
  });

  // Fetch the user's existing store on page load
  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        setUserId(session.user.id);

        const { data: store, error } = await supabase
          .from('stores')
          .select('id, name, slug')
          .eq('owner_id', session.user.id)
          .single();

        if (store) {
          setStoreId(store.id);
          setFormData({
            storeName: store.name,
            storeSlug: store.slug,
          });
        }
      } catch (error) {
        console.error("Error fetching store:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchStoreDetails();
  }, []);

  // Auto-format the slug to be URL-friendly (lowercase, no spaces, only hyphens)
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedSlug = rawValue
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-')         // Prevent double hyphens
      .replace(/^-/, '');          // Prevent starting with a hyphen

    setFormData({ ...formData, storeSlug: formattedSlug });
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);

    try {
      // Upsert: Update if it exists (storeId), Insert if it doesn't
      const { data, error } = await supabase.from('stores').upsert({
        id: storeId || undefined, 
        owner_id: userId,
        name: formData.storeName.trim(),
        slug: formData.storeSlug,
      }).select().single();

      if (error) {
        // Handle unique constraint error if someone already took that slug
        if (error.code === '23505') {
          throw new Error("That store link is already taken. Please choose another one.");
        }
        throw error;
      }

      setStoreId(data.id);
      toast.success(storeId ? "Store details updated!" : "Store created successfully!");
      
    } catch (error: any) {
      toast.error(error.message || "Failed to save store details.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.storeName.trim() !== "" && formData.storeSlug.trim() !== "";

  if (isFetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your brand identity and public storefront link.
        </p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Information Banner */}
          {!storeId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-800">Welcome to SokoPOS!</h3>
                <p className="mt-1 text-sm text-emerald-600">
                  Before you can add products, you need to set up your store's name and public link.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-6">
            
            {/* Store Name Input */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-bold text-slate-700 mb-2">
                Store Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="storeName"
                  type="text" 
                  required 
                  value={formData.storeName} 
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white" 
                  placeholder="e.g. Denis Tech Electronics" 
                />
              </div>
            </div>

            {/* Store Slug (URL) Input */}
            <div>
              <label htmlFor="storeSlug" className="block text-sm font-bold text-slate-700 mb-2">
                Public Store Link
              </label>
              <div className="flex rounded-xl shadow-sm border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all bg-slate-50 focus-within:bg-white">
                <span className="flex items-center pl-4 pr-1 text-slate-500 sm:text-sm font-medium select-none">
                  <LinkIcon className="h-4 w-4 mr-2 text-slate-400" />
                  localsoko.com/
                </span>
                <input
                  id="storeSlug"
                  type="text"
                  required
                  value={formData.storeSlug}
                  onChange={handleSlugChange}
                  className="flex-1 py-2.5 pr-4 pl-1 outline-none text-sm font-bold text-slate-900 bg-transparent"
                  placeholder="denis-tech"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                This is the link you will share with your customers on WhatsApp and social media.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={isLoading || !isFormValid} 
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>{storeId ? "Update Store" : "Create Store"}</span>
                    <Save className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}