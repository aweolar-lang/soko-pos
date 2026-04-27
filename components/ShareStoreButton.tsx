"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner"; // Assuming you are using Sonner since you used it in the AddToCart button!

export default function ShareStoreButton({ storeName }: { storeName: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shop at ${storeName} on LocalSoko`,
          text: `Check out these amazing products from ${storeName}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing", error);
      }
    } else {
      // Fallback for desktop browsers that don't support native sharing
      navigator.clipboard.writeText(window.location.href);
      toast.success("Store link copied to clipboard!");
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-slate-200 transition-colors"
    >
      <Share2 className="h-4 w-4" />
      Share Store
    </button>
  );
}