"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { Store, Link as LinkIcon, Phone, Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingStore, setHasExistingStore] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    paybill_number: "",
  });

  // 1. Fetch existing store data when the page loads
  useEffect(() => {
    async function fetchStore() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (data) {
        setHasExistingStore(true);
        setFormData({
          name: data.name || "",
          slug: data.slug || "",
          paybill_number: data.paybill_number || "",
        });
      }
      setIsLoading(false);
    }
    fetchStore();
  }, [user]);

  // 2. Auto-generate slug from name if they haven't typed a custom one
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      // Only auto-update the slug if they are creating a NEW store
      slug: !hasExistingStore ? newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug
    }));
  };

  // 3. Save to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Not authenticated");
    
    // Clean up the slug just in case they typed spaces
    const cleanSlug = formData.slug.toLowerCase().replace(/[^a-z0-9\-]+/g, '-');
    setIsSubmitting(true);

    try {
      if (hasExistingStore) {
        // UPDATE existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name: formData.name,
            slug: cleanSlug,
            paybill_number: formData.paybill_number,
          })
          .eq('owner_id', user.id);
          
        if (error) throw error;
        toast.success("Store settings updated!");
      } else {
        // CREATE new store
        const { error } = await supabase
          .from('stores')
          .insert({
            owner_id: user.id,
            name: formData.name,
            slug: cleanSlug,
            paybill_number: formData.paybill_number,
          });
          
        if (error) throw error;
        toast.success("Store created successfully!");
        setHasExistingStore(true);
      }
    } catch (error: any) {
      // Handle the case where they pick a slug that is already taken
      if (error.code === '23505') {
        toast.error("That Store URL is already taken. Please choose another.");
      } else {
        toast.error(error.message || "Failed to save settings");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900">Store Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          {hasExistingStore 
            ? "Manage your public storefront and payment details." 
            : "Create your SokoPOS store to get started."}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Store Branding */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Branding</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Store Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  required type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="e.g. Denis Tech Electronics"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Public Store URL</label>
              <div className="flex rounded-xl shadow-sm border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                <span className="flex items-center px-4 bg-slate-50 text-slate-500 border-r border-slate-200 text-sm font-medium">
                  localsoko.com/
                </span>
                <input 
                  required type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '')})}
                  className="w-full pl-3 pr-4 py-2.5 outline-none text-sm font-bold text-emerald-600"
                  placeholder="denis-tech"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> 
                This is the link you will share with your customers on Instagram and WhatsApp.
              </p>
            </div>
          </div>

          {/* Section 2: Financials */}
          <div className="space-y-6 pt-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Payments</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">M-Pesa Paybill / Till Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  value={formData.paybill_number}
                  onChange={(e) => setFormData({...formData, paybill_number: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="e.g. 123456"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                If you have a business till, add it here for walk-in POS customers.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              {isSubmitting ? "Saving..." : (hasExistingStore ? "Save Settings" : "Create Store")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}