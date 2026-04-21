"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { Package, DollarSign, Image as ImageIcon, X, Hash, Loader2, ArrowLeft, AlignLeft, Tags } from "lucide-react"; 
import { toast } from "sonner";
import Link from "next/link";

const CATEGORIES = ["Electronics", "Fashion", "Food & Beverage", "Furniture", "Services", "Other"];

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useUser();
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

  // 1. Get the user's store ID so we know WHERE to save this product
  useEffect(() => {
    async function fetchStore() {
      if (!user) return;
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();
        
      if (data) setStoreId(data.id);
    }
    fetchStore();
  }, [user]);

  // Image Upload Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...selectedFiles].slice(0, 4)); // Max 4 images
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Submit to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Store profile not found!");
    
    setIsSubmitting(true);

    try {
      // Create a URL-friendly slug (e.g., "MacBook Pro" -> "macbook-pro-8372")
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);

      // (In a real app, you would upload the 'images' files to Supabase Storage here and get their URLs)
      // For now, we will leave the images array empty to focus on the database architecture
      const imageUrls: string[] = []; 

      // Save to Products Table
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        title: formData.title,
        slug: slug,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        stock_quantity: Number(formData.stock_quantity),
        images: imageUrls,
      });

      if (error) throw error;

      toast.success("Product added successfully!");
      router.push("/dashboard/inventory"); // Send them back to the table

    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
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
          
          {/* Row 1: Title & Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Product Title</label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  required type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="e.g. iPhone 15 Pro"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <div className="relative">
                <Tags className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm appearance-none bg-white"
                >
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
                <input 
                  required type="number" min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Initial Stock Quantity</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  required type="number" min="1"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Product Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <textarea 
                required rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm resize-none"
                placeholder="Describe your product..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="animate-spin h-5 w-5" /> Saving Product...</> : "Publish Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}