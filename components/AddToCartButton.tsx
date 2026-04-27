"use client";

import { ShoppingCart, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store/useCartStore";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    is_digital?: boolean;
  };
  storeId: string;
}

export default function AddToCartButton({ product, storeId }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    const result = addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        image: product.images?.[0] || null,
        is_digital: product.is_digital,
      },
      storeId
    );

    if (result.success) {
      toast.success(`Added ${product.title} to cart`);
    } else {
      toast.error(result.error); // Shows the multi-store warning!
    }
  };

  return (
    <button
      onClick={handleAdd}
      className={`w-full py-3 rounded-xl text-white font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${
        product.is_digital
          ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
          : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
      }`}
    >
      <Plus className="h-5 w-5" />
      <ShoppingCart className="h-4 w-4 opacity-70" />
      Add to Cart
    </button>
  );
}