"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, DollarSign, Image as ImageIcon, X, Hash, Loader2, ArrowLeft, AlignLeft, Tags } from "lucide-react"; 
import { toast } from "sonner";
import Link from "next/link";

// 1. Import our shared bulletproof client!
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Electronics", "Fashion", "Food & Beverage", "Furniture", "Services","Supermarket","Beauty","Other"];
const MAX_IMAGES = 5; // Updated to 5 images max!

export default function AddProductPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "Electronics",
    stock_quantity: "1",
  });

  // 2. The Bulletproof Fetch: Ask Supabase directly for the session
  useEffect(() => {
    async function fetchStore() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();
        
      if (data) setStoreId(data.id);
    }
    fetchStore();
  }, []);

  // Image Upload Handlers (Limited to 5)
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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Submit to Database & Storage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Store profile not found!");
    
    setIsSubmitting(true);
    const toastId = toast.loading("Publishing product...");

    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
      const imageUrls: string[] = []; 

      // 3. Upload images to Supabase Storage
      if (images.length > 0) {
        for (const file of images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${storeId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get the public URL to save in our database
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      // 4. Save everything to the Products Table
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        title: formData.title,
        slug: slug,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        description: formData.description,
        category: formData.category,
        images: imageUrls, // Now contains the real URLs!
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
    <div className="max-w-3xl mx-auto py-6">
      <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Inventory
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-black text-slate-900">Add New Product</h1>
          <p className="text-slate-500 text-sm mt-1">Fill out the details to add this item to your store.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Product Images (Max {MAX_IMAGES})</label>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative w-24 h-24 shrink-0 rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {images.length < MAX_IMAGES && (
                <label className="w-24 h-24 shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-colors">
                  <ImageIcon className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-[10px] font-medium text-slate-500">Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Row 1: Title & Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Product Title</label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" placeholder="e.g. iPhone 15 Pro" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <div className="relative">
                <Tags className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm appearance-none bg-slate-50 focus:bg-white">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Price & Stock */}
          <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (Ksh)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-white" placeholder="0" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Initial Stock Quantity</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="number" min="1" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-white" placeholder="10" />
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Product Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm resize-none bg-slate-50 focus:bg-white" placeholder="Describe your product..." />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2">
              {isSubmitting ? <><Loader2 className="animate-spin h-5 w-5" /> Publishing...</> : "Publish Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}