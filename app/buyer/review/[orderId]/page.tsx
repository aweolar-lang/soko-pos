"use client";

// 1. ADD 'use' TO YOUR IMPORTS
import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { submitReview } from "../../dashboard/actions";

//1,2. GRAB 'orderId' INSTEAD OF 'id'
export default function ReviewPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [rating, setRating] = useState(5);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 2. GRAB 'orderId' INSTEAD OF 'id'
  const resolvedParams = use(params);
  const realOrderId = resolvedParams.orderId; 

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    formData.append("rating", rating.toString());
    formData.append("orderId", realOrderId);

    startTransition(async () => {
      try {
        const result = await submitReview(formData);
        
        // 1. Check for expected errors returned gracefully from the action
        if (result?.error) {
          toast.error(result.error);
          return; // Exit early so we don't try to route!
        } 
        
        // 2. Success path
        toast.success("Review published successfully!");
        router.push("/buyer/dashboard");
        router.refresh();

      } catch (error: any) {
        // 3. Catch unexpected crashes (e.g., Supabase throws a 500 error)
        console.error("Review submission failed:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  }


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        
        {/* Back Button */}
        <Link 
          href="/buyer/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-lg px-2 py-1 -ml-2"
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
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button" 
                    onClick={() => setRating(starValue)}
                    className="p-2 focus:outline-none transition-transform active:scale-90 touch-manipulation"
                  >
                    <Star
                      className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                        starValue <= rating 
                          ? "fill-amber-400 text-amber-400" 
                          : "fill-transparent text-slate-300" 
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest" aria-live="polite">
                {rating === 5 && "Excellent"}
                {rating === 4 && "Great"}
                {rating === 3 && "Average"}
                {rating === 2 && "Poor"}
                {rating === 1 && "Terrible"}
              </p>
            </div>

            {/* Comment Box */}
            <div className="space-y-3">
              <label htmlFor="comment" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" aria-hidden="true" /> 
                Add a written review <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={4}
                placeholder="What did you love? What could be improved?"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isPending} 
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Submitting...
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