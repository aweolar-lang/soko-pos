"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// NOTE: We will create this exact action file in the very next step!
import { submitReview } from "../../dashboard/actions"; 

export default function ReviewPage({ params }: { params: { orderId: string } }) {
  const [rating, setRating] = useState(5);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    formData.append("rating", rating.toString());
    formData.append("orderId", params.orderId);

    startTransition(async () => {
      const result = await submitReview(formData);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Review published successfully!");
        router.push("/buyer/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        
        {/* Back Button */}
        <Link 
          href="/buyer/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Main Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Rate Your Order</h1>
          <p className="text-slate-500 text-sm mb-8">
            Your feedback helps keep the LocalSoko community safe and trustworthy.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Interactive Star Selection */}
            <div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 transition-all duration-200 hover:scale-110 focus:outline-none ${
                      star <= rating 
                        ? "text-amber-400 drop-shadow-sm" 
                        : "text-slate-200 hover:text-amber-200"
                    }`}
                  >
                    <Star className="w-10 h-10 fill-current" />
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest">
                {rating === 5 && "Excellent"}
                {rating === 4 && "Great"}
                {rating === 3 && "Average"}
                {rating === 2 && "Poor"}
                {rating === 1 && "Terrible"}
              </p>
            </div>

            {/* Comment Box */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" /> 
                Add a written review <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="comment"
                rows={4}
                placeholder="What did you love? What could be improved?"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button 
              disabled={isPending} 
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                </span>
              ) : (
                "Publish Review"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}