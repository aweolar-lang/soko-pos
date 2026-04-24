"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Store, Link as LinkIcon, Loader2, Save, AlertCircle, MapPin, Building2, Map, ImagePlus, AlignLeft, Smartphone, Tags, Truck, Banknote, Landmark, Lock } from "lucide-react";
import { toast } from "sonner";

const STORE_CATEGORIES = [
  "Food & Beverage", 
  "Electronics", 
  "Furniture", 
  "Fashion", 
  "Supermarket", 
  "Beauty", 
  "Services",
  "Digital Products",
  "Other"
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [originalPaybill, setOriginalPaybill] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
    description: "", 
    category: "", 
    county: "",
    town: "",
    area: "",
    paybill_number: "", // We use this to store EITHER the M-Pesa number or Bank Account number locally
    existingLogoUrl: "", 
    paystack_subaccount_code: "", 
    offers_delivery: false,
    currency: "KES",
    // NEW UI-ONLY STATES FOR GLOBAL PAYOUTS
    payoutMethod: "MOBILE_MONEY", 
    bankCode: "",
  });

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUserId(user.id);

        const { data: store, error } = await supabase
          .from("stores")
          .select("id, name, slug, description, category, county, town, area, paybill_number, logo_url, paystack_subaccount_code, offers_delivery, currency")
          .eq("owner_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (store) {
          setStoreId(store.id);
          setOriginalPaybill(store.paybill_number || "");
          setFormData({
            storeName: store.name || "",
            storeSlug: store.slug || "",
            description: store.description || "",
            category: store.category || "", 
            county: store.county || "",
            town: store.town || "",
            area: store.area || "",
            paybill_number: store.paybill_number || "",
            existingLogoUrl: store.logo_url || "",
            paystack_subaccount_code: store.paystack_subaccount_code || "",
            offers_delivery: store.offers_delivery || false,
            currency: store.currency || "KES",
            // We assume mobile money initially if they have an old account, 
            // they can change it if they need to update routing
            payoutMethod: "MOBILE_MONEY",
            bankCode: "", 
          });
        }
      } catch (error: any) {
        console.error("Error fetching store:", error.message);
        toast.error("Failed to load store profile.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchStoreDetails();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("User not authenticated.");

    setIsLoading(true);
    const toastId = toast.loading("Saving store profile...");

    try {
      let finalLogoUrl = formData.existingLogoUrl;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('store-assets')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('store-assets')
          .getPublicUrl(filePath);

        finalLogoUrl = publicUrlData.publicUrl;
      }

      const slugifiedName = formData.storeSlug
        ? formData.storeSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // We DO NOT save payoutMethod or bankCode to the DB, they are just used to generate the Subaccount Code!
      const updates = {
        owner_id: userId,
        name: formData.storeName,
        slug: slugifiedName,
        description: formData.description,
        category: formData.category, 
        county: formData.county,
        town: formData.town,
        area: formData.area,
        paybill_number: formData.paybill_number, // Saves the actual account/phone number for record keeping
        logo_url: finalLogoUrl,
        offers_delivery: formData.offers_delivery,
        currency: formData.currency, 
      };

      if (storeId) {
        const { error } = await supabase.from('stores').update(updates).eq('id', storeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('stores').insert([updates]);
        if (error) throw error;
      }

      // UPGRADE: Smarter Payout Routing Call!
      if (formData.paybill_number && formData.paybill_number !== originalPaybill) {
        toast.loading("Setting up payment details...", { id: toastId });
        
        const payRes = await fetch("/api/seller/payout-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payoutMethod: formData.payoutMethod,
            accountNumber: formData.paybill_number,
            bankCode: formData.payoutMethod === "BANK" ? formData.bankCode : undefined,
            storeName: formData.storeName
          }),
        });
        
        const payData = await payRes.json();
        
        if (!payRes.ok) {
          throw new Error(payData.error || "Failed to verify payout details");
        }
        
        setOriginalPaybill(formData.paybill_number);
        setFormData(prev => ({...prev, paystack_subaccount_code: payData.subaccount_code}));
      }

      toast.success("Store profile saved successfully!", { id: toastId });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while saving.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Currency can only be selected during initial setup
  const isCurrencyLocked = !!storeId;
  const isFormValid = formData.storeName && formData.county && formData.paybill_number && formData.category;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Store Settings</h1>
        <p className="mt-1.5 sm:mt-2 text-sm text-slate-500">
          Manage your storefront details, location, and fulfillment options.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSave} className="p-5 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* Logo Upload */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 group hover:border-emerald-500 transition-colors">
              {(logoPreview || formData.existingLogoUrl) ? (
                <img src={logoPreview || formData.existingLogoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-slate-300" />
              )}
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <ImagePlus className="h-6 w-6 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="mt-2 sm:mt-0">
              <h3 className="font-bold text-slate-900 text-lg">Store Logo</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Upload your brand's logo. This will be displayed on your public storefront and marketplace listings.
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Row 1: Store Name & Category */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Store Name</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  type="text" required value={formData.storeName} 
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} 
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                  placeholder="e.g. The Coffee House" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Store Category</label>
              <div className="relative">
                <Tags className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <select 
                  required
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white appearance-none"
                >
                  <option value="" disabled>Select a category...</option>
                  {STORE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Slug & Description */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Store URL (Slug)</label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  type="text" value={formData.storeSlug} 
                  onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })} 
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                  placeholder="e.g. the-coffee-house" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Store Description</label>
              <div className="relative">
                <AlignLeft className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <textarea 
                  rows={3} value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white resize-none" 
                  placeholder="Tell buyers what you sell..." 
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Row 3: Location */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 sm:mb-5">Location Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">County</label>
                <div className="relative">
                  <Map className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.county} 
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                    placeholder="e.g. Nairobi" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Town/City</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.town} 
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                    placeholder="e.g. Westlands" 
                  />
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Specific Area</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.area} 
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                    placeholder="e.g. Sarit Center" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Toggle */}
          <div className="bg-blue-50/50 p-5 sm:p-6 rounded-3xl border border-blue-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Delivery Options
            </h3>
            <p className="text-sm text-slate-500 mb-5">Do you offer delivery or shipping to your customers?</p>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={formData.offers_delivery}
                  onChange={(e) => setFormData({...formData, offers_delivery: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="font-bold text-slate-800 text-sm">Yes, we offer delivery services</span>
            </label>
          </div>

          {/* Currency Settings (WITH LOCK LOGIC) */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-colors ${isCurrencyLocked ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/30 border-amber-100'}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Banknote className={`h-5 w-5 ${isCurrencyLocked ? 'text-slate-400' : 'text-amber-500'}`} />
              Store Currency
            </h3>
            <p className="text-sm text-slate-500 mb-5">Choose the base currency for your store. This is what buyers will be charged in.</p>
            
            <div className="flex gap-4 max-w-sm">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all ${isCurrencyLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${formData.currency === 'KES' ? (isCurrencyLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-amber-500 bg-amber-50 text-amber-700') : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="currency" 
                  value="KES" 
                  disabled={isCurrencyLocked}
                  checked={formData.currency === 'KES'}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="sr-only" 
                />
                <span className="font-bold text-xl">🇰🇪</span>
                <span className="font-bold">KES</span>
              </label>
              
              <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all ${isCurrencyLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${formData.currency === 'USD' ? (isCurrencyLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-amber-500 bg-amber-50 text-amber-700') : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="currency" 
                  value="USD" 
                  disabled={isCurrencyLocked}
                  checked={formData.currency === 'USD'}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="sr-only" 
                />
                <span className="font-bold text-xl">🇺🇸</span>
                <span className="font-bold">USD</span>
              </label>
            </div>

            {isCurrencyLocked && (
              <p className="text-xs text-amber-600 mt-4 flex items-center gap-1.5 font-bold bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 w-fit">
                <Lock className="h-3.5 w-3.5" /> Currency cannot be changed after setup. Contact support.
              </p>
            )}
          </div>

          {/* UPGRADE: Payout Details (GLOBAL SUPPORT) */}
          <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" />
              Payout Settings
            </h3>
            <p className="text-sm text-slate-500 mb-5 sm:mb-6">Where should we automatically send your money when a customer pays?</p>
            
            {/* Payout Toggle */}
            <div className="flex gap-3 max-w-md mb-6">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.payoutMethod === 'MOBILE_MONEY' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'}`}>
                <input 
                  type="radio" name="payoutMethod" value="MOBILE_MONEY" 
                  checked={formData.payoutMethod === 'MOBILE_MONEY'}
                  onChange={(e) => setFormData({...formData, payoutMethod: e.target.value})}
                  className="sr-only" 
                />
                <Smartphone className="h-4 w-4" /> M-Pesa
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.payoutMethod === 'BANK' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'}`}>
                <input 
                  type="radio" name="payoutMethod" value="BANK" 
                  checked={formData.payoutMethod === 'BANK'}
                  onChange={(e) => setFormData({...formData, payoutMethod: e.target.value})}
                  className="sr-only" 
                />
                <Landmark className="h-4 w-4" /> Bank Account
              </label>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-6">
              
              {/* Conditional Bank Code Input */}
              {formData.payoutMethod === 'BANK' && (
                <div className="flex-1 animate-in fade-in zoom-in duration-200">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bank Code</label>
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" required={formData.payoutMethod === 'BANK'} 
                      value={formData.bankCode} 
                      onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })} 
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-white" 
                      placeholder="e.g. 044 (Access Bank)" 
                    />
                  </div>
                </div>
              )}

              {/* Account Number Input */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {formData.payoutMethod === 'MOBILE_MONEY' ? "M-Pesa Number / Till Number" : "Bank Account Number"}
                </label>
                <div className="relative">
                  {formData.payoutMethod === 'MOBILE_MONEY' ? (
                    <Smartphone className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  ) : (
                    <Banknote className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  )}
                  <input 
                    type="text" required value={formData.paybill_number} 
                    onChange={(e) => setFormData({ ...formData, paybill_number: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-white" 
                    placeholder={formData.payoutMethod === 'MOBILE_MONEY' ? "e.g. 0712345678 or Till Number" : "Enter account number"} 
                  />
                </div>
              </div>
              
              {formData.paystack_subaccount_code && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100 px-4 py-3 sm:py-3.5 rounded-xl border border-emerald-200 font-bold w-full md:w-auto justify-center md:justify-start">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  Routing Active
                </div>
              )}
            </div>
            
            {formData.payoutMethod === 'BANK' && (
              <p className="text-xs text-slate-500 mt-3 font-medium">
                Ensure your Bank Code matches your region's official Paystack bank routing codes.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" disabled={isLoading || !isFormValid} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}