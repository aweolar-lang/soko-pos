"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutButton({ productId, storeName }: { productId: string, storeName: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    // Paystack requires an email. In a real app, you'd have a checkout form.
    // For now, we'll use a simple browser prompt.
    const email = window.prompt(`Enter your email to get your receipt from ${storeName}:`);
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, buyerEmail: email }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect the user to the Paystack secure checkout page!
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Could not start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={isLoading}
      className="mt-auto w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-70"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {isLoading ? "Connecting..." : "Buy Now"}
    </button>
  );
}