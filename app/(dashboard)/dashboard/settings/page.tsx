"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { 
  Store, Link as LinkIcon, Loader2, Save, AlertCircle, MapPin, 
  Building2, Map, ImagePlus, AlignLeft, Smartphone, Tags, Truck, 
  Banknote, Landmark, Lock, FileText, User 
} from "lucide-react";
import { toast } from "sonner";
import { isValidName, isValidKRAPin, formatKenyanPhone } from "@/lib/validators";

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
    kra_pin: "", // NEW: KRA Pin for compliance
    settlement_name: "", // NEW: Business/Owner Identity name
    paybill_number: "", // M-Pesa or Bank Account
    existingLogoUrl: "", 
    paystack_subaccount_code: "", 
    offers_delivery: false,
    currency: "KES",
    payoutMethod: "MOBILE_MONEY", 
    bankCode: "",
  });

  const [errors, setErrors] = useState({
  storeName: "",
  description: "",
  kra_pin: "",
  settlement_name: "",
  paybill_number: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
  
  if (errors[name as keyof typeof errors]) {
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }
  };

  // 4. Validate Fields on Blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

      // Store Name Validation
    if (name === "storeName" && value.trim().length < 3) {
      setErrors((prev) => ({ ...prev, storeName: "Store name must be at least 3 characters." }));
    }

  // Description Validation
    if (name === "description" && value.trim().length < 10) {
      setErrors((prev) => ({ ...prev, description: "Description must be at least 10 characters." }));
    }
  
  // KRA PIN Validation
    if (name === "kra_pin" && !isValidKRAPin(value)) {
      setErrors((prev) => ({ ...prev, kra_pin: "Invalid KRA PIN. Must start with P/A, have 9 digits, and end with a letter." }));
    }

  // Settlement Name (Bank Account Name) Validation
    if (name === "settlement_name" && !isValidName(value)) {
      setErrors((prev) => ({ ...prev, settlement_name: "Please enter a valid legal name." }));
    }

    // Paybill / Account Number Validation (UPDATED FOR TILLS)
    if (name === "paybill_number") {
      
      if (formData.payoutMethod === 'MOBILE_MONEY') {
        // 1. Remove any accidental spaces the user typed
        const cleanValue = value.replace(/\s/g, '');

        // 2. Check if it is a Till or Paybill Number (Usually 5 to 8 digits long)
        const isTillOrPaybill = /^\d{5,8}$/.test(cleanValue);

        if (isTillOrPaybill) {
          // It's a Till number! Just save the clean numeric value.
          setFormData((prev) => ({ ...prev, paybill_number: cleanValue }));
        } else {
          // It's NOT a Till number, so it must be a Phone Number. Run our formatter.
          const formattedPhone = formatKenyanPhone(value);
          
          if (!formattedPhone) {
            setErrors((prev) => ({ 
              ...prev, 
              paybill_number: "Invalid entry. Enter a 5-8 digit Till Number OR a valid 07XX... phone number." 
            }));
          } else {
            // It's a valid phone number! Save the 254... formatted version.
            setFormData((prev) => ({ ...prev, paybill_number: formattedPhone }));
          }
        }
      } 
      
      else if (formData.payoutMethod === 'BANK') {
        // Basic Bank Account Validation (e.g., must be numeric and between 8-15 digits)
        const bankRegex = /^\d{8,15}$/;
        if (!bankRegex.test(value.replace(/\s/g, ''))) {
          setErrors((prev) => ({ ...prev, paybill_number: "Invalid Bank Account Number (8-15 digits)." }));
        }
      }
    }
  };

const isFormValid = 
  formData.storeName.trim().length >= 3 &&
  formData.kra_pin.trim() !== "" &&
  formData.settlement_name.trim() !== "" &&
  formData.paybill_number.trim() !== "" &&
  formData.county.trim() !== "" &&
  formData.category.trim() !== "" &&
  !Object.values(errors).some(error => error !== "");


  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUserId(user.id);

        const { data: store, error } = await supabase
          .from("stores")
          .select("id, name, slug, description, category, county, town, area, kra_pin, settlement_name, paybill_number, logo_url, paystack_subaccount_code, offers_delivery, currency")
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
            kra_pin: store.kra_pin || "",
            settlement_name: store.settlement_name || "",
            paybill_number: store.paybill_number || "",
            existingLogoUrl: store.logo_url || "",
            paystack_subaccount_code: store.paystack_subaccount_code || "",
            offers_delivery: store.offers_delivery || false,
            currency: store.currency || "KES",
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

      const updates = {
        owner_id: userId,
        name: formData.storeName,
        slug: slugifiedName,
        description: formData.description,
        category: formData.category, 
        county: formData.county,
        town: formData.town,
        area: formData.area,
        kra_pin: formData.kra_pin,
        settlement_name: formData.settlement_name,
        paybill_number: formData.paybill_number, 
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

      // Payout Routing Call (Only fires if paybill changed/is new)
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

  // Once the store ID is generated, financials are permanently locked.
  const isFinancialsLocked = !!storeId; 
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Store Settings</h1>
        <p className="mt-1.5 sm:mt-2 text-sm text-slate-500">
          Manage your storefront details, location, and compliance documents.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
        
        {/* ==========================================
            SECTION 1: STOREFRONT & OPERATIONS
            ========================================== */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6 sm:space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">1. Storefront & Operations</h2>
            <p className="text-sm text-slate-500 mt-1">Public details visible to your customers.</p>
          </div>

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
        </div>

        {/* ==========================================
            SECTION 2: COMPLIANCE & PAYOUTS
            ========================================== */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6 sm:space-y-8">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                2. Compliance & Payouts 
                {isFinancialsLocked && <Lock className="h-5 w-5 text-amber-500" />}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Required for marketplace compliance. <strong className="text-amber-600">These details cannot be changed once submitted.</strong>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {/* KRA PIN */}
            <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">KRA PIN</label>
               <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
    <input 
      type="text" 
      name="kra_pin" 
      required
      value={formData.kra_pin} 
      onChange={handleInputChange} 
      onBlur={handleBlur}
      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm uppercase ${errors.kra_pin ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
      placeholder="e.g. P123456789A" 
    />
  </div>
  {errors.kra_pin && <p className="text-red-500 text-xs mt-1">{errors.kra_pin}</p>}
</div>

            {/* Currency Settings */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Store Currency</label>
              <div className="flex-wrap p-3 gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${formData.currency === 'KES' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-slate-200 bg-white text-slate-600'}`}>
                  <input 
                    type="radio" name="currency" value="KES" 
                    disabled={isFinancialsLocked}
                    checked={formData.currency === 'KES'}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="sr-only" 
                  />
                  <span className="font-bold text-xl">🇰🇪</span> <span className="font-bold">KES</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${formData.currency === 'USD' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-slate-200 bg-white text-slate-600'}`}>
                  <input 
                    type="radio" name="currency" value="USD" 
                    disabled={isFinancialsLocked}
                    checked={formData.currency === 'USD'}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="sr-only" 
                  />
                  <span className="font-bold text-xl">🇺🇸</span> <span className="font-bold">USD</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Payout Details */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-colors ${isFinancialsLocked ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/30 border-blue-100'}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Landmark className={`h-5 w-5 ${isFinancialsLocked ? 'text-slate-400' : 'text-blue-600'}`} />
              Settlement Details
            </h3>
            <p className="text-sm text-slate-500 mb-5 sm:mb-6">Where should we automatically send your marketplace earnings?</p>
            
            {/* Payout Toggle */}
            <div className="flex-wrap p-3 gap-3 max-w-md mb-6">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.payoutMethod === 'MOBILE_MONEY' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm') : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                <input 
                  type="radio" name="payoutMethod" value="MOBILE_MONEY" 
                  disabled={isFinancialsLocked}
                  checked={formData.payoutMethod === 'MOBILE_MONEY'}
                  onChange={(e) => setFormData({...formData, payoutMethod: e.target.value})}
                  className="sr-only" 
                />
                <Smartphone className="h-4 w-4" /> M-Pesa
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.payoutMethod === 'BANK' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm') : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                <input 
                  type="radio" name="payoutMethod" value="BANK" 
                  disabled={isFinancialsLocked}
                  checked={formData.payoutMethod === 'BANK'}
                  onChange={(e) => setFormData({...formData, payoutMethod: e.target.value})}
                  className="sr-only" 
                />
                <Landmark className="h-4 w-4" /> Bank Account
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              {/* Account Name */}
               <div>
  <label className="block text-sm font-bold text-slate-700 mb-1">Legal Business / Owner Name</label>
  <div className="relative">
    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
    <input 
      type="text" 
      name="settlement_name" 
      required
      value={formData.settlement_name} 
      onChange={handleInputChange} 
      onBlur={handleBlur}
      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.settlement_name ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
      placeholder="Name matching your KRA PIN" 
    />
  </div>
  {errors.settlement_name && <p className="text-red-500 text-xs mt-1">{errors.settlement_name}</p>}
</div>

              {/* Conditional Bank Code Input */}
              {formData.payoutMethod === 'BANK' && (
                <div className="animate-in fade-in zoom-in duration-200">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bank Code</label>
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" required={formData.payoutMethod === 'BANK'} 
                      disabled={isFinancialsLocked}
                      value={formData.bankCode} 
                      onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })} 
                      className={`w-full pl-11 pr-4 py-3 sm:py-3.5 border rounded-xl outline-none transition-all text-base sm:text-sm ${isFinancialsLocked ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'}`} 
                      placeholder="e.g. 044 (Access Bank)" 
                    />
                  </div>
                </div>
              )}

              {/* Account Number Input */}
              <div>
  <label className="block text-sm font-bold text-slate-700 mb-1">
    {formData.payoutMethod === 'MOBILE_MONEY' ? 'M-Pesa Number' : 'Bank Account Number'}
  </label>
  <div className="relative">
    <Banknote className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
    <input 
      type="text" 
      name="paybill_number" 
      required
      value={formData.paybill_number} 
      onChange={handleInputChange} 
      onBlur={handleBlur}
      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.paybill_number ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
      placeholder={formData.payoutMethod === 'MOBILE_MONEY' ? "e.g. 0712345678" : "Enter account number"} 
    />
  </div>
  {errors.paybill_number && <p className="text-red-500 text-xs mt-1">{errors.paybill_number}</p>}
</div>
            </div>
            
            {formData.paystack_subaccount_code && (
              <div className="mt-5 flex items-center gap-2 text-sm text-blue-700 bg-blue-100 px-4 py-3 sm:py-3.5 rounded-xl border border-blue-200 font-bold justify-center md:justify-start w-fit">
                <AlertCircle className="h-5 w-5 shrink-0" />
                Verified & Routing Active
              </div>
            )}
          </div>
        </div>

        {/* Global Save Button */}
        <div className="pt-2 flex justify-end">
          <button 
            type="submit" disabled={isLoading || !isFormValid} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing...</span></>
            ) : (
              <><span>{storeId ? "Save Operations Updates" : "Create My Store"}</span><Save className="h-5 w-5" /></>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}