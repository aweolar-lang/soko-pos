"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Plus, Loader2, Search, Edit, Trash2, Package, AlertCircle, X, Tags } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  category: string;
  images: string[];
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: Track the store's currency
  const [storeCurrency, setStoreCurrency] = useState("KES");

  // QUICK EDIT STATE
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: 0, stock_quantity: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Inventory
  useEffect(() => {
    async function fetchInventory() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // UPGRADE: Fetch the currency column
      const { data: store } = await supabase
        .from('stores')
        .select('id, currency')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        setStoreCurrency(store.currency || "KES"); // Save currency to state

        const { data: items } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });
        
        if (items) setProducts(items);
      }
      setIsLoading(false);
    }
    
    fetchInventory();
  }, []);

  // EDIT LOGIC
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      price: product.price,
      stock_quantity: product.stock_quantity
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving changes...");

    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: editForm.title,
          price: editForm.price,
          stock_quantity: editForm.stock_quantity
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, title: editForm.title, price: editForm.price, stock_quantity: editForm.stock_quantity }
          : p
      ));

      toast.success("Product updated successfully!", { id: toastId });
      setEditingProduct(null); 
    } catch (error: any) {
      toast.error("Failed to update: " + error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item Logic
  const handleDelete = async (productId: string, imageUrls: string[]) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    const toastId = toast.loading("Removing product...");
    try {
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (dbError) throw dbError;

      if (imageUrls?.length > 0) {
        const paths = imageUrls.map(url => url.split('/product-images/')[1]).filter(Boolean);
        await supabase.storage.from('product-images').remove(paths);
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product removed", { id: toastId });
    } catch (error: any) {
      toast.error("Delete failed: " + error.message, { id: toastId });
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to dynamically show currency symbol
  const sym = storeCurrency === "USD" ? "$" : "Ksh ";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 sm:pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Inventory Manager</h1>
          <p className="text-slate-500 text-sm mt-1 sm:mt-2">Manage your products, pricing, and stock levels.</p>
        </div>
        
        {/* Full width on mobile, auto on desktop */}
        <Link 
          href="/dashboard/inventory/new"
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm shadow-emerald-600/20"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base sm:text-sm bg-white focus:bg-white"
            />
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold text-lg">No products found</p>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              {searchQuery ? "Try adjusting your search criteria." : "Click 'Add Product' to list your first item."}
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE VIEW (Cards instead of a Table) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 flex gap-4 items-center bg-white hover:bg-slate-50 transition-colors">
                  {/* Image */}
                  <div className="h-16 w-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 m-5 text-slate-300" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate mb-0.5">{product.title}</h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* UPGRADE: DYNAMIC CURRENCY */}
                      <span className="font-black text-emerald-600 text-sm">{sym}{product.price.toLocaleString()}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold truncate max-w-[80px]">
                        {product.category || "General"}
                      </span>
                    </div>
                    {product.stock_quantity <= 5 ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold text-[10px]">
                        <AlertCircle className="h-3 w-3" /> {product.stock_quantity} left
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-medium">{product.stock_quantity} in stock</span>
                    )}
                  </div>

                  {/* Actions (Stacked) */}
                  <div className="flex flex-col gap-2 shrink-0 border-l border-slate-100 pl-4">
                    <button onClick={() => openEditModal(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id, product.images)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. DESKTOP VIEW (Classic Table) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    {/* UPGRADE: DYNAMIC CURRENCY */}
                    <th className="px-6 py-4">Price ({storeCurrency})</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 m-2.5 text-slate-300" />
                            )}
                          </div>
                          <span className="font-bold text-slate-800 truncate max-w-[200px] lg:max-w-[300px]">{product.title}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-black text-emerald-600">
                        {/* UPGRADE: DYNAMIC CURRENCY */}
                        {sym}{product.price.toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        {product.stock_quantity <= 5 ? (
                          <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-md w-fit text-xs">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {product.stock_quantity} Low
                          </span>
                        ) : (
                          <span className="text-slate-700 font-medium">{product.stock_quantity} units</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(product)} title="Quick Edit" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id, product.images)} title="Delete Product" className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* QUICK EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900">Quick Edit</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200 shadow-sm">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Product Title</label>
                <input 
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-slate-900 text-base sm:text-sm bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {/* UPGRADE: DYNAMIC CURRENCY */}
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Price ({storeCurrency})</label>
                  <input 
                    type="number" 
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-black text-emerald-600 text-base sm:text-sm bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Stock Qty</label>
                  <input 
                    type="number" 
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({...editForm, stock_quantity: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-900 text-base sm:text-sm bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 shrink-0">
              <button 
                onClick={() => setEditingProduct(null)}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 order-1 sm:order-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}