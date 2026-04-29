"use client";

import { useState } from "react";
import { Image as ImageIcon, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { CldUploadWidget } from 'next-cloudinary';
// Adjust these import paths depending on your folder structure
import { createShoppablePost } from "../actions/community"; 
import ProductPicker, { ProductTag } from "./ProductPicker";

interface CreatePostFormProps {
  authorId: string;
  authorType: "merchant" | "buyer";
  authorName: string;
}

export default function CreatePostForm({ authorId, authorType, authorName }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // UPGRADE: Now stores an array of visually selected product objects instead of a raw string
  const [taggedProducts, setTaggedProducts] = useState<ProductTag[]>([]); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("authorId", authorId);
      formData.append("authorType", authorType);
      formData.append("authorName", authorName);
      
      if (imageUrl) formData.append("imageUrl", imageUrl);
      
      // Convert the array of visual products back into a comma-separated string for the database action
      if (taggedProducts.length > 0) {
        const tagIds = taggedProducts.map(p => p.id).join(',');
        formData.append("taggedProducts", tagIds);
      }

      const result = await createShoppablePost(formData);

      if (result.success) {
        setSuccess(true);
        setContent("");
        setImageUrl("");
        setTaggedProducts([]); // Clear the visual picker
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to post.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black">
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Create a Post</h3>
          <p className="text-xs text-slate-500 font-medium">Posting as {authorName} ({authorType})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* TEXT CONTENT */}
        <div>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's dropping? Share an update, tutorial, or review..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none min-h-[120px]"
          />
        </div>

        {/* CLOUDINARY IMAGE UPLOAD ZONE */}
        <div>
          {imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
              <img src={imageUrl} alt="Upload preview" className="w-full h-auto max-h-64 object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black text-white rounded-full backdrop-blur-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <CldUploadWidget 
              uploadPreset="ls_default" 
              onSuccess={(result: any) => {
                setImageUrl(result?.info?.secure_url); 
              }}
            >
              {({ open }) => {
                return (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-all group"
                  >
                    <div className="p-3 bg-white border border-slate-200 rounded-full group-hover:shadow-sm transition-all mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm">Add High-Quality Photo</span>
                    <span className="text-xs mt-1 opacity-70">JPG, PNG, WebP up to 5MB</span>
                  </button>
                );
              }}
            </CldUploadWidget>
          )}
        </div>

        {/* --- NEW VISUAL PRODUCT PICKER --- */}
        <ProductPicker 
          selectedProducts={taggedProducts}
          onChange={setTaggedProducts}
        />
        {/* --- END VISUAL PRODUCT PICKER --- */}

        {/* STATUS MESSAGES */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-100 transition-all">
            <CheckCircle2 className="w-4 h-4" /> Post published successfully!
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Publishing...
              </>
            ) : (
              "Publish to Community"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}