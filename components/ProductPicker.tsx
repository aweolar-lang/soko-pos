"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, Loader2, X, Plus, Tag as TagIcon, Image as ImageIcon } from "lucide-react";

// Initialize public Supabase client for searching products
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ProductTag {
  id: string;
  name: string;
  price: number;
  main_image_url: string | null;
}

interface ProductPickerProps {
  selectedProducts: ProductTag[];
  onChange: (products: ProductTag[]) => void;
}

export default function ProductPicker({ selectedProducts, onChange }: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductTag[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced Search Effect
  useEffect(() => {
    // Wait 300ms after the user stops typing before hitting the database
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, main_image_url")
        .ilike("name", `%${term}%`) // Case-insensitive search
        .limit(5); // Keep the UI clean by only showing top 5 matches

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: ProductTag) => {
    // Prevent tagging the same product twice
    if (!selectedProducts.find((p) => p.id === product.id)) {
      onChange([...selectedProducts, product]);
    }
    // Clear the search bar after selection
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveProduct = (productId: string) => {
    onChange(selectedProducts.filter((p) => p.id !== productId));
  };

  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <TagIcon className="w-4 h-4 text-emerald-500" />
        <label className="text-sm font-bold text-slate-700">Tag Products (Shoppable)</label>
      </div>

      {/* SELECTED PRODUCTS CHIPS */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedProducts.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center gap-2 bg-white border border-emerald-200 pl-2 pr-1 py-1 rounded-lg shadow-sm"
            >
              {product.main_image_url ? (
                <img src={product.main_image_url} alt={product.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                </div>
              )}
              <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">{product.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveProduct(product.id)}
                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a product to tag..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />

        {/* SEARCH DROPDOWN RESULTS */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((product) => {
              const isAlreadySelected = selectedProducts.some(p => p.id === product.id);
              
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isAlreadySelected}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                    isAlreadySelected ? "bg-slate-50 opacity-50 cursor-not-allowed" : "hover:bg-slate-50"
                  } border-b border-slate-100 last:border-0`}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-300"/></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">Ksh {product.price}</p>
                  </div>
                  {!isAlreadySelected && (
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}