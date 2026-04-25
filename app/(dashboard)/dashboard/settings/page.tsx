"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { 
  Store, Link as LinkIcon, Loader2, Save, AlertCircle, MapPin, 
  Building2, Map, ImagePlus, AlignLeft, Smartphone, Tags, Truck, 
  Banknote, Landmark, Lock, FileText, User, Mailbox 
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
  
  // <-- Added Step Wizard State -->
  const [currentStep, setCurrentStep] = useState(1);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [originalPayoutAccount, setOriginalPayoutAccount] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
    description: "", 
    category: "", 
    county: "",
    town: "",
    area: "",
    postal_address: "", 
    kra_pin: "", 
    settlement_name: "", 
    existingLogoUrl: "", 
    offers_delivery: false,
    currency: "KES",
    payout_method: "MOBILE_MONEY", 
    payout_account_number: "", 
    payout_bank_code: "",
    paystack_subaccount_code: "", 
  });

  const [errors, setErrors] = useState({
    storeName: "",
    description: "",
    kra_pin: "",
    settlement_name: "",
    payout_account_number: "",
    postal_address: "", // <-- Added error state for postal address
  });

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // 1. Targeted formatting for Slug
    if (name === "storeSlug") {
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    // 2. Targeted formatting for Names & Addresses
    const titleCaseFields = ["storeName", "county", "town", "area", "postal_address", "settlement_name"];
    
    if (titleCaseFields.includes(name)) {
      // ONLY fields inside the titleCaseFields array get limited
      const MAX_CHARS = 50; // Bumped to 50 so addresses don't get cut off!
      
      if (value.length > MAX_CHARS) {
        value = value.slice(0, MAX_CHARS);
      }

      // Apply the Title Casing
      value = value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    // 3. Description bypasses the limits above and comes straight here safely!
    if(name === "description") {
      if (value.length > 500) {
        value = value.slice(0, 500);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if (name === "storeName" && value.trim().length < 3) {
      setErrors((prev) => ({ ...prev, storeName: "Store name must be at least 3 characters." }));
    }

    if (name === "description" && value.trim().length < 10) {
      setErrors((prev) => ({ ...prev, description: "Description must be at least 10 characters." }));
    }
  
    if (name === "kra_pin" && !isValidKRAPin(value)) {
      setErrors((prev) => ({ ...prev, kra_pin: "Invalid KRA PIN. Must start with P/A, have 9 digits, and end with a letter." }));
    }

    if (name === "settlement_name" && !isValidName(value)) {
      setErrors((prev) => ({ ...prev, settlement_name: "Please enter a valid legal name." }));
    }

    // <-- Added Robust Postal Address Validation -->
    if (name === "postal_address") {
      const cleanAddress = value.trim();
      // Enforce at least 5 characters to avoid random letters, and optionally check for digits
      if (cleanAddress.length < 5 || !/\d/.test(cleanAddress)) {
        setErrors((prev) => ({ ...prev, postal_address: "Please enter a valid postal address (e.g., P.O Box 12345 or 12345-00100)." }));
      }
    }

    if (name === "payout_account_number") {
      if (formData.payout_method === 'MOBILE_MONEY') {
        const cleanValue = value.replace(/\s/g, '');
        const isTillOrPaybill = /^\d{5,8}$/.test(cleanValue);

        if (isTillOrPaybill) {
          setFormData((prev) => ({ ...prev, payout_account_number: cleanValue }));
        } else {
          const formattedPhone = formatKenyanPhone(value);
          
          if (!formattedPhone) {
            setErrors((prev) => ({ 
              ...prev, 
              payout_account_number: "Invalid entry. Enter a 5-8 digit Till Number OR a valid 07XX... phone number." 
            }));
          } else {
            setFormData((prev) => ({ ...prev, payout_account_number: formattedPhone }));
          }
        }
      } 
      else if (formData.payout_method === 'BANK') {
        const bankRegex = /^\d{8,15}$/;
        if (!bankRegex.test(value.replace(/\s/g, ''))) {
          setErrors((prev) => ({ ...prev, payout_account_number: "Invalid Bank Account Number (8-15 digits)." }));
        }
      }
    }
  };

  // <-- Separated Validation Logic for the Wizard Steps -->
  const isStep1Valid = 
    formData.storeName.trim().length >= 3 && 
    formData.category.trim() !== "" &&
    !errors.storeName && !errors.description;

  const isStep2Valid = 
    formData.county.trim() !== "" && 
    formData.town.trim() !== "" && 
    formData.area.trim() !== "" && 
    formData.postal_address.trim() !== "" && 
    !errors.postal_address;

  const isStep3Valid = 
    formData.kra_pin.trim() !== "" && 
    formData.settlement_name.trim() !== "" && 
    formData.payout_account_number.trim() !== "" && 
    !errors.kra_pin && !errors.settlement_name && !errors.payout_account_number;

  const isFormValid = isStep1Valid && isStep2Valid && isStep3Valid;

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUserId(user.id);

        const { data: store, error } = await supabase
          .from("stores")
          .select("id, name, slug, description, category, county, town, area, postal_address, kra_pin, settlement_name, payout_method, payout_account_number, payout_bank_code, logo_url, paystack_subaccount_code, offers_delivery, currency")
          .eq("owner_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (store) {
          setStoreId(store.id);
          setOriginalPayoutAccount(store.payout_account_number || "");
          setFormData({
            storeName: store.name || "",
            storeSlug: store.slug || "",
            description: store.description || "",
            category: store.category || "", 
            county: store.county || "",
            town: store.town || "",
            area: store.area || "",
            postal_address: store.postal_address || "", 
            kra_pin: store.kra_pin || "",
            settlement_name: store.settlement_name || "",
            existingLogoUrl: store.logo_url || "",
            offers_delivery: store.offers_delivery || false,
            currency: store.currency || "KES",
            payout_method: store.payout_method || "MOBILE_MONEY",
            payout_account_number: store.payout_account_number || "",
            payout_bank_code: store.payout_bank_code || "",
            paystack_subaccount_code: store.paystack_subaccount_code || "",
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

      let currentSubaccountCode = formData.paystack_subaccount_code;

      if (formData.payout_account_number && formData.payout_account_number !== originalPayoutAccount) {
        toast.loading("Verifying payment details...", { id: toastId });
        
        const payRes = await fetch("/api/seller/payout-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payoutMethod: formData.payout_method,
            accountNumber: formData.payout_account_number,
            bankCode: formData.payout_method === "BANK" ? formData.payout_bank_code : undefined,
            storeName: formData.storeName
          }),
        });
        
        const payData = await payRes.json();
        
        if (!payRes.ok) {
          throw new Error(payData.error || "Paystack rejected this account number.");
        }
        
        currentSubaccountCode = payData.subaccount_code;
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
        postal_address: formData.postal_address, 
        kra_pin: formData.kra_pin,
        settlement_name: formData.settlement_name,
        payout_method: formData.payout_method,
        payout_account_number: formData.payout_account_number, 
        payout_bank_code: formData.payout_bank_code,
        paystack_subaccount_code: currentSubaccountCode, 
        logo_url: finalLogoUrl,
        offers_delivery: formData.offers_delivery,
        currency: formData.currency, 
      };

      if (storeId) {
        const { error } = await supabase.from('stores').update(updates).eq('id', storeId);
        if (error) throw error;
      } else {
        const { data: newStore, error } = await supabase.from('stores').insert([updates]).select('id').single();
        if (error) throw error;
        setStoreId(newStore.id); 
      }

      setOriginalPayoutAccount(formData.payout_account_number);
      setFormData(prev => ({...prev, paystack_subaccount_code: currentSubaccountCode}));

      toast.success("Store profile saved successfully!", { id: toastId });

    } catch (error: any) {
      console.error("Save Error:", error);
      let errorMessage = error.message || "An error occurred while saving.";
      if (error.code === '23505') {
        errorMessage = "That Store URL is already taken. Please type a different URL.";
      } 
      else if (errorMessage.toLowerCase().includes("paystack") || errorMessage.toLowerCase().includes("invalid")) {
        errorMessage = "Payment Setup Failed: Double check your account number and try again.";
      }
      toast.error(errorMessage, { id: toastId });
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

  const isFinancialsLocked = !!formData.paystack_subaccount_code;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-12">
      <div className="text-center sm:text-left mb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Store Settings</h1>
        <p className="mt-1.5 sm:mt-2 text-sm text-slate-500">
          Manage your storefront details, location, and compliance documents.
        </p>
      </div>

      {/* <-- Added Step Progress Indicator --> */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-lg mx-auto relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-emerald-500 -z-10 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          ></div>

          {[1, 2, 3].map(step => (
            <div 
              key={step} 
              className={`h-11 w-11 rounded-full flex items-center justify-center font-bold border-4 border-white transition-all duration-300 ${currentStep >= step ? 'bg-emerald-500 text-white shadow-md scale-110' : 'bg-slate-200 text-slate-400'}`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-lg mx-auto mt-3 text-xs sm:text-sm font-bold text-slate-400 px-1">
          <span className={currentStep >= 1 ? 'text-emerald-700' : ''}>Storefront</span>
          <span className={currentStep >= 2 ? 'text-emerald-700' : ''}>Location</span>
          <span className={currentStep >= 3 ? 'text-emerald-700' : ''}>Payouts</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 sm:space-y-8">
        
        {/* ==========================================
            STEP 1: STOREFRONT & OPERATIONS
            ========================================== */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 sm:space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">1. Storefront & Operations</h2>
              <p className="text-sm text-slate-500 mt-1">Public details visible to your customers.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 group hover:border-emerald-50 transition-colors">
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

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.storeName} name="storeName" 
                    onChange={handleInputChange} onBlur={handleBlur} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                    placeholder="e.g. The Coffee House" 
                  />
                </div>
                {errors.storeName && <p className="text-red-500 text-xs mt-1">{errors.storeName}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Store Category</label>
                <div className="relative">
                  <Tags className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <select 
                    required name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
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

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Store URL (Slug)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" value={formData.storeSlug} name="storeSlug" 
                    onChange={handleInputChange} 
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
                    rows={3} value={formData.description} name="description" 
                    onChange={handleInputChange} onBlur={handleBlur} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white resize-none" 
                    placeholder="Tell buyers what you sell..." 
                  />
                </div>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 2: LOCATION & DELIVERY
            ========================================== */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 sm:space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">2. Location Details</h2>
              <p className="text-sm text-slate-500 mt-1">Where are you based?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">County</label>
                <div className="relative">
                  <Map className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.county} name="county" 
                    onChange={handleInputChange} 
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
                    type="text" required value={formData.town} name="town" 
                    onChange={handleInputChange} 
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
                    type="text" required value={formData.area} name="area" 
                    onChange={handleInputChange} 
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-slate-50 focus:bg-white" 
                    placeholder="e.g. Sarit Center" 
                  />
                </div>
              </div>
              
              {/* Postal Address Field */}
              <div className="sm:col-span-2 lg:col-span-3"> 
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Postal Address</label>
                <div className="relative">
                  <Mailbox className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" required value={formData.postal_address} name="postal_address"
                    onChange={handleInputChange} onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 sm:py-3.5 border rounded-xl outline-none transition-all text-base sm:text-sm ${errors.postal_address ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
                    placeholder="e.g. P.O Box 12345-00100, Nairobi" 
                  />
                </div>
                {errors.postal_address && <p className="text-red-500 text-xs mt-1">{errors.postal_address}</p>}
              </div>
            </div>

            <div className="bg-blue-50/50 p-5 sm:p-6 rounded-3xl border border-blue-100 mt-6">
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
        )}

        {/* ==========================================
            STEP 3: COMPLIANCE & PAYOUTS
            ========================================== */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 sm:space-y-8">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  3. Compliance & Payouts 
                  {isFinancialsLocked && <Lock className="h-5 w-5 text-amber-500" />}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isFinancialsLocked ? <span className="text-amber-600 font-bold">These details are locked to protect your payouts.</span> : "Required for marketplace compliance."}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">KRA PIN</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    name="kra_pin" 
                    required
                    disabled={isFinancialsLocked} 
                    value={formData.kra_pin} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm uppercase ${isFinancialsLocked ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : errors.kra_pin ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
                    placeholder="e.g. P123456789A" 
                  />
                </div>
                {errors.kra_pin && <p className="text-red-500 text-xs mt-1">{errors.kra_pin}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Store Currency</label>
                <div className="flex gap-4"> 
                  <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${formData.currency === 'KES' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-slate-200 bg-white text-slate-600'}`}>
                    <input 
                      type="radio" name="currency" value="KES" 
                      disabled={isFinancialsLocked} 
                      checked={formData.currency === 'KES'}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="sr-only" 
                    />
                    <span className="font-bold text-xl">🇰🇪</span> <span className="font-bold">KES</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${formData.currency === 'USD' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-slate-200 bg-white text-slate-600'}`}>
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

            <div className={`p-5 sm:p-6 rounded-3xl border transition-colors ${isFinancialsLocked ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/30 border-blue-100'}`}>
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Landmark className={`h-5 w-5 ${isFinancialsLocked ? 'text-slate-400' : 'text-blue-600'}`} />
                Settlement Details
              </h3>
              <p className="text-sm text-slate-500 mb-5 sm:mb-6">Where should we automatically send your marketplace earnings?</p>
              
              <div className="flex flex-wrap gap-4 max-w-md mb-6"> 
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.payout_method === 'MOBILE_MONEY' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm') : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" name="payout_method" value="MOBILE_MONEY" 
                    disabled={isFinancialsLocked} 
                    checked={formData.payout_method === 'MOBILE_MONEY'}
                    onChange={(e) => setFormData({...formData, payout_method: e.target.value})}
                    className="sr-only" 
                  />
                  <Smartphone className="h-4 w-4" /> M-Pesa
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isFinancialsLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.payout_method === 'BANK' ? (isFinancialsLocked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm') : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" name="payout_method" value="BANK" 
                    disabled={isFinancialsLocked} 
                    checked={formData.payout_method === 'BANK'}
                    onChange={(e) => setFormData({...formData, payout_method: e.target.value})}
                    className="sr-only" 
                  />
                  <Landmark className="h-4 w-4" /> Bank Account
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Legal Business / Owner Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      name="settlement_name" 
                      required
                      disabled={isFinancialsLocked} 
                      value={formData.settlement_name} 
                      onChange={handleInputChange} 
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${isFinancialsLocked ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : errors.settlement_name ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
                      placeholder="Name matching your KRA PIN" 
                    />
                  </div>
                  {errors.settlement_name && <p className="text-red-500 text-xs mt-1">{errors.settlement_name}</p>}
                </div>

                {formData.payout_method === 'BANK' && (
                  <div className="animate-in fade-in zoom-in duration-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bank Code</label>
                    <div className="relative">
                      <Landmark className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                      <input 
                        type="text" name="payout_bank_code" 
                        required={formData.payout_method === 'BANK'} 
                        disabled={isFinancialsLocked} 
                        value={formData.payout_bank_code} 
                        onChange={handleInputChange} 
                        className={`w-full pl-11 pr-4 py-3 sm:py-3.5 border rounded-xl outline-none transition-all text-base sm:text-sm ${isFinancialsLocked ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'}`} 
                        placeholder="e.g. 044 (Access Bank)" 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {formData.payout_method === 'MOBILE_MONEY' ? 'M-Pesa Number or Till' : 'Bank Account Number'}
                  </label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      name="payout_account_number" 
                      required
                      disabled={isFinancialsLocked} 
                      value={formData.payout_account_number} 
                      onChange={handleInputChange} 
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${isFinancialsLocked ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : errors.payout_account_number ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
                      placeholder={formData.payout_method === 'MOBILE_MONEY' ? "e.g. 0712345678 or 123456" : "Enter account number"} 
                    />
                  </div>
                  {errors.payout_account_number && <p className="text-red-500 text-xs mt-1">{errors.payout_account_number}</p>}
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
        )}

        {/* <-- STEP NAVIGATION FOOTER --> */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 1 || isLoading}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'}`}
          >
            Back
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
              className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              Next Step
            </button>
          ) : (
            <button 
              type="submit" disabled={isLoading || !isFormValid} 
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing...</span></>
              ) : (
                <><span>{storeId ? "Save All Updates" : "Create My Store"}</span><Save className="h-5 w-5" /></>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}