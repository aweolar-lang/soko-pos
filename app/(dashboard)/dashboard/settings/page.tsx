"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Store, Link as LinkIcon, Loader2, Save, AlertCircle, MapPin, Building2, Map, ImagePlus, AlignLeft, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Track original paybill to know if we need to hit the Paystack API on save
  const [originalPaybill, setOriginalPaybill] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
    description: "", 
    county: "",
    town: "",
    area: "",
    paybill_number: "", // Handles Till or Phone Number
    existingLogoUrl: "", 
    paystack_subaccount_code: "", // Tracks their subaccount status
  });

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        setUserId(session.user.id);

        const { data: store } = await supabase
          .from('stores')
          .select('id, name, slug, description, logo_url, county, town, area, paybill_number, paystack_subaccount_code')
          .eq('owner_id', session.user.id)
          .single();

        if (store) {
          setStoreId(store.id);
          setOriginalPaybill(store.paybill_number || "");
          setFormData({
            storeName: store.name || "",
            storeSlug: store.slug || "",
            description: store.description || "",
            county: store.county || "",
            town: store.town || "",
            area: store.area || "",
            paybill_number: store.paybill_number || "",
            existingLogoUrl: store.logo_url || "",
            paystack_subaccount_code: store.paystack_subaccount_code || "",
          });
          
          if (store.logo_url) setLogoPreview(store.logo_url);
        }
      } catch (error) {
        console.error("Error fetching store:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchStoreDetails();
  }, []);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '');
    setFormData({ ...formData, storeSlug: formattedSlug });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    const toastId = toast.loading("Saving store settings...");

    try {
      let finalLogoUrl = formData.existingLogoUrl;
      let finalSubaccountCode = formData.paystack_subaccount_code;

      // 1. Upload Logo if a new one was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('store-assets').upload(filePath, logoFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('store-assets').getPublicUrl(filePath);
        finalLogoUrl = publicUrlData.publicUrl;
      }

      // 2. Generate Paystack Subaccount if M-Pesa number changed
      if (formData.paybill_number && formData.paybill_number !== originalPaybill) {
        toast.loading("Verifying M-Pesa details with Paystack...", { id: toastId });
        
        const paystackRes = await fetch("/api/seller/payout-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mpesaNumber: formData.paybill_number,
            storeName: formData.storeName,
          })
        });

        const paystackData = await paystackRes.json();
        
        if (!paystackRes.ok) {
          throw new Error(paystackData.error || "Failed to link M-Pesa account.");
        }
        
        finalSubaccountCode = paystackData.subaccount_code;
        setOriginalPaybill(formData.paybill_number); // Update tracked original
      }

      // 3. Save everything to the database
      const { data, error } = await supabase.from('stores').upsert({
        id: storeId || undefined, 
        owner_id: userId,
        name: formData.storeName.trim(),
        slug: formData.storeSlug,
        description: formData.description.trim(),
        logo_url: finalLogoUrl,
        county: formData.county.trim(),
        town: formData.town.trim(),
        area: formData.area.trim(),
        paybill_number: formData.paybill_number.trim(),
        paystack_subaccount_code: finalSubaccountCode,
      }).select().single();

      if (error) {
        if (error.code === '23505') throw new Error("That store link is already taken. Please choose another one.");
        throw error;
      }

      setStoreId(data.id);
      setFormData(prev => ({ 
        ...prev, 
        existingLogoUrl: finalLogoUrl,
        paystack_subaccount_code: finalSubaccountCode
      }));
      setLogoFile(null); 
      
      toast.success(storeId ? "Store profile updated!" : "Store created successfully!", { id: toastId });
      
    } catch (error: any) {
      toast.error(error.message || "Failed to save store details.", { id: toastId });
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
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your brand identity, public link, and physical location.
        </p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {!storeId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-800">Welcome to LocalSoko!</h3>
                <p className="mt-1 text-sm text-emerald-600">
                  Before you can add products, set up your store's profile.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-8">
            
            {/* Logo Upload Section */}
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 rounded-full border-4 border-slate-50 bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0 group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Store Logo" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-8 w-8 text-slate-300" />
                )}
                <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <ImagePlus className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Store Logo</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Upload a square image. This will appear on your public storefront and in the marketplace search.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />
            
            {/* Store Name & Slug */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.storeName} 
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                    placeholder="e.g. Denis Tech Electronics" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Public Store Link</label>
                <div className="flex rounded-xl shadow-sm border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition-all bg-slate-50 focus-within:bg-white">
                  <span className="flex items-center pl-4 pr-1 text-slate-500 text-sm font-medium select-none">
                    <LinkIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                    localsoko.com/
                  </span>
                  <input
                    type="text" required value={formData.storeSlug} onChange={handleSlugChange}
                    className="flex-1 py-2.5 pr-4 pl-1 outline-none text-sm font-bold text-slate-900 bg-transparent min-w-[100px]"
                    placeholder="denis-tech"
                  />
                </div>
              </div>
            </div>

            {/* Store Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Short Description</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <textarea 
                  rows={3} value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm resize-none bg-slate-50 focus:bg-white" 
                  placeholder="Tell customers what you sell..." 
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Location Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Physical Location</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">County</label>
                  <div className="relative">
                    <Map className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" required value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" placeholder="e.g. Nairobi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Town / City</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" required value={formData.town} onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" placeholder="e.g. Westlands"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Specific Area</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" required value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" placeholder="e.g. Moi Avenue"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* NEW: Automated Payout Section */}
            <div className="bg-slate-50 -mx-6 sm:-mx-8 p-6 sm:p-8 border-y border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payout Settings</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md">
                    Enter the M-Pesa Phone Number or Till Number where your sales earnings should be automatically sent.
                  </p>
                </div>
                {formData.paystack_subaccount_code && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Verified
                  </span>
                )}
              </div>
              
              <div className="max-w-md">
                <label className="block text-sm font-bold text-slate-700 mb-2">M-Pesa Number / Till</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.paybill_number} 
                    onChange={(e) => setFormData({ ...formData, paybill_number: e.target.value })} 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-white" 
                    placeholder="e.g. 0712345678 or Till Number" 
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button 
                type="submit" disabled={isLoading || !isFormValid} 
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Saving...</span></>
                ) : (
                  <><span>{storeId ? "Save Profile" : "Create Store"}</span><Save className="h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}