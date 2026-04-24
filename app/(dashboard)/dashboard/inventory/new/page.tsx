"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, DollarSign, Image as ImageIcon, X, Hash, Loader2, ArrowLeft, AlignLeft, Tags, FileDown, UploadCloud, Lock } from "lucide-react"; 
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Electronics", "Fashion", "Food & Beverage", "Furniture", "Services", "Supermarket", "Beauty", "Other"];
const DIGITAL_CATEGORIES = ["eBook", "Software", "Template", "Audio", "Video", "Course", "Digital Art", "Other Digital"];
const MAX_IMAGES = 5;

export default function AddProductPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeCategory, setStoreCategory] = useState<string | null>(null);
  const [storeCurrency, setStoreCurrency] = useState("KES");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  
  // 1. Data State
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "Electronics",
    stock_quantity: "1",
  });

  // 2. Error State for Validation
  const [errors, setErrors] = useState({
    title: "",
    price: "",
    description: "",
    stock_quantity: "",
  });

  useEffect(() => {
    async function fetchStore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('stores')
        .select('id, category, currency')
        .eq('owner_id', user.id)
        .single();
        
      if (data) {
        setStoreId(data.id);
        setStoreCategory(data.category);
        setStoreCurrency(data.currency || "KES");

        if (data.category === "Digital Products") {
          setIsDigital(true);
          setFormData(prev => ({ ...prev, category: DIGITAL_CATEGORIES[0] }));
        } else if (data.category !== "Supermarket") {
          setFormData(prev => ({ ...prev, category: data.category }));
        }
      }
    }
    fetchStore();
  }, []);

  // 3. Handle Input Changes & Clear Errors
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
    
    if (name === "title" && value.trim().length < 3) {
      setErrors((prev) => ({ ...prev, title: "Title must be at least 3 characters." }));
    }
    
    if (name === "price") {
      const priceNum = parseFloat(value);
      if (isNaN(priceNum) || priceNum < 0) {
        setErrors((prev) => ({ ...prev, price: "Please enter a valid positive price." }));
      }
    }

    if (name === "stock_quantity" && !isDigital) {
      const stockNum = parseInt(value, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        setErrors((prev) => ({ ...prev, stock_quantity: "Please enter a valid stock quantity." }));
      }
    }

    if (name === "description" && value.trim().length < 10) {
      setErrors((prev) => ({ ...prev, description: "Description must be at least 10 characters." }));
    }
  };

  // 5. Form Validity Check for Submit Button
  const isFormValid = 
    formData.title.trim().length >= 3 &&
    !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) >= 0 &&
    (isDigital || (!isNaN(parseInt(formData.stock_quantity, 10)) && parseInt(formData.stock_quantity, 10) >= 0)) &&
    formData.description.trim().length >= 10 &&
    !Object.values(errors).some(error => error !== "");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > MAX_IMAGES) {
        toast.error(`You can only upload a maximum of ${MAX_IMAGES} images.`);
        return;
      }
      setImages(prev => [...prev, ...selectedFiles].slice(0, MAX_IMAGES));
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews].slice(0, MAX_IMAGES));
    }
  };

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDigitalFile(e.target.files[0]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDigital = () => {
    if (storeCategory === "Digital Products") return; 
    
    const nextDigital = !isDigital;
    setIsDigital(nextDigital);
    
    if (nextDigital) {
      setFormData(prev => ({ ...prev, category: DIGITAL_CATEGORIES[0] }));
      setErrors(prev => ({ ...prev, stock_quantity: "" })); // Clear stock errors if switching to digital
    } else {
      setFormData(prev => ({ 
        ...prev, 
        category: storeCategory === "Supermarket" ? CATEGORIES[0] : (storeCategory || CATEGORIES[0]) 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Store profile not found!");
    
    if (isDigital && !digitalFile) return toast.error("Please upload the digital file (PDF, ZIP, etc).");
    if (!isDigital && !formData.stock_quantity) return toast.error("Please provide a stock quantity for physical items.");

    setIsSubmitting(true);
    const toastId = toast.loading("Publishing product...");

    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
      const imageUrls: string[] = []; 
      let uploadedFileUrl = null;

      if (images.length > 0) {
        for (const file of images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${storeId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      if (isDigital && digitalFile) {
        toast.loading("Uploading digital asset...", { id: toastId });
        const fileExt = digitalFile.name.split('.').pop();
        const fileName = `${storeId}-${Date.now()}-asset.${fileExt}`;
        const filePath = `downloads/${fileName}`;

        const { error: fileUploadError } = await supabase.storage
          .from('digital-products') 
          .upload(filePath, digitalFile);

        if (fileUploadError) throw fileUploadError;

        uploadedFileUrl = filePath; 
      }

      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        title: formData.title,
        slug: slug,
        price: parseFloat(formData.price),
        stock_quantity: isDigital ? 999999 : parseInt(formData.stock_quantity, 10),
        description: formData.description,
        category: formData.category,
        images: imageUrls,
        is_digital: isDigital,
        file_url: uploadedFileUrl,
        currency: storeCurrency 
      });

      if (error) throw error;

      toast.success("Product added successfully!", { id: toastId });
      router.push("/dashboard/inventory"); 

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to add product", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-8">
      <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Inventory
      </Link>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Add New Product</h1>
          <p className="text-slate-500 text-sm mt-1 sm:mt-2">List a physical item or a downloadable digital product.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 sm:space-y-8">
          
          {/* DIGITAL TOGGLE */}
          <div 
            className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${storeCategory === 'Digital Products' ? 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed' : 'bg-blue-50 border-blue-100 hover:bg-blue-100/50 cursor-pointer'}`} 
            onClick={toggleDigital}
          >
            <div>
              <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <FileDown className="h-5 w-5 text-blue-600" />
                Digital Product
                {storeCategory === 'Digital Products' && <Lock className="h-3 w-3 text-slate-400 ml-1" />}
              </h3>
              <p className="text-sm text-blue-800/80 mt-0.5">Is this a downloadable item like an eBook, PDF, or ZIP file?</p>
            </div>
            <div className="relative shrink-0">
              <input type="checkbox" checked={isDigital} readOnly className="sr-only peer" />
              <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${storeCategory === 'Digital Products' ? 'bg-blue-400' : 'bg-slate-300 peer-checked:bg-blue-600'}`}></div>
            </div>
          </div>

          {/* DIGITAL FILE UPLOAD ZONE */}
          {isDigital && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Downloadable File</label>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${digitalFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  {digitalFile ? (
                    <>
                      <FileDown className="w-8 h-8 text-emerald-600 mb-2" />
                      <p className="text-sm font-bold text-emerald-900 truncate max-w-[250px]">{digitalFile.name}</p>
                      <p className="text-xs text-emerald-700 mt-1">{(digitalFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-700 mb-1">Click to upload your product file</p>
                      <p className="text-xs text-slate-500">ZIP, PDF, DOCX, etc. (Max 50MB)</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" onChange={handleDigitalFileChange} />
              </label>
            </div>
          )}

          <hr className="border-slate-100" />

          {/* Image Upload Section */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Product Images (Max {MAX_IMAGES})</label>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl border border-slate-200 overflow-hidden group shadow-sm">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              
              {images.length < MAX_IMAGES && (
                <label className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-colors bg-slate-50/50">
                  <ImageIcon className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-500">Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Title</label>
              <div className="relative">
                <Package className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  required type="text" name="title"
                  value={formData.title} 
                  onChange={handleInputChange} 
                  onBlur={handleBlur}
                  className={`w-full pl-11 pr-4 py-3 sm:py-2.5 border rounded-xl outline-none transition-all text-base sm:text-sm font-medium ${errors.title ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="e.g. Master React JS eBook" 
                />
              </div>
              {errors.title && <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-medium">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {isDigital ? "Digital Format" : "Category"}
              </label>
              <div className="relative">
                <Tags className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                
                {isDigital ? (
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full pl-11 pr-10 py-3 sm:py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm font-medium appearance-none bg-slate-50 focus:bg-white cursor-pointer">
                    {DIGITAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                ) : storeCategory === "Supermarket" ? (
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full pl-11 pr-10 py-3 sm:py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm font-medium appearance-none bg-slate-50 focus:bg-white cursor-pointer">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                ) : (
                  <input type="text" readOnly value={formData.category} className="w-full pl-11 pr-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl outline-none text-base sm:text-sm font-bold text-slate-600 bg-slate-100 cursor-not-allowed" />
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Price & Stock */}
          <div className={`grid grid-cols-1 ${!isDigital ? 'md:grid-cols-2' : ''} gap-5 sm:gap-6 p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100`}>
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selling Price ({storeCurrency})</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  required type="number" min="0" step="any" name="price"
                  value={formData.price} 
                  onChange={handleInputChange} 
                  onBlur={handleBlur}
                  className={`w-full pl-11 pr-4 py-3 sm:py-2.5 border rounded-xl outline-none transition-all text-base sm:text-sm font-black shadow-sm ${errors.price ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-500' : 'border-slate-200 bg-white text-emerald-600 focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="0" 
                />
              </div>
              {errors.price && <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-medium">{errors.price}</p>}
            </div>
            
            {!isDigital && (
              <div className="animate-in fade-in zoom-in duration-200">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Stock Quantity</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    required={!isDigital} type="number" min="1" name="stock_quantity"
                    value={formData.stock_quantity} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 sm:py-2.5 border rounded-xl outline-none transition-all text-base sm:text-sm font-bold shadow-sm ${errors.stock_quantity ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-500' : 'border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                    placeholder="10" 
                  />
                </div>
                {errors.stock_quantity && <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-medium">{errors.stock_quantity}</p>}
              </div>
            )}
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <textarea 
                required rows={4} name="description"
                value={formData.description} 
                onChange={handleInputChange} 
                onBlur={handleBlur}
                className={`w-full pl-11 pr-4 py-3.5 sm:py-3 border rounded-xl outline-none transition-all text-base sm:text-sm resize-none font-medium ${errors.description ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-500' : 'border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
                placeholder="Describe your product in detail..." 
              />
            </div>
            {errors.description && <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-medium">{errors.description}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-2 sm:pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting || !isFormValid} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 sm:py-3.5 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-md shadow-slate-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <><Loader2 className="animate-spin h-5 w-5" /> Publishing...</> : "Publish Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}