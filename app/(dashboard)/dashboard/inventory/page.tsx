"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Plus,Loader2, Search, Edit, Trash2, Package, AlertCircle, X } from "lucide-react";
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

  // --- NEW: QUICK EDIT STATE ---
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
      
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (store) {
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

  // --- NEW: EDIT LOGIC ---
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

      // Update the UI instantly so they don't have to refresh
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, title: editForm.title, price: editForm.price, stock_quantity: editForm.stock_quantity }
          : p
      ));

      toast.success("Product updated successfully!", { id: toastId });
      setEditingProduct(null); // Close the modal
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventory Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your products, pricing, and stock levels.</p>
        </div>
        
        <Link 
          href="/dashboard/inventory/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price (Ksh)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No products found</p>
                    <p className="text-slate-400 text-sm mt-1">Click "Add Product" to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 m-2.5 text-slate-300" />
                          )}
                        </div>
                        <span className="font-bold text-slate-800">{product.title}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {product.price.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      {product.stock_quantity <= 5 ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-md w-fit text-xs">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {product.stock_quantity} Low Stock
                        </span>
                      ) : (
                        <span className="text-slate-700 font-medium">{product.stock_quantity} units</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                  
                        <button 
                          onClick={() => openEditModal(product)}
                          title="Quick Edit"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button 
                            onClick={() => handleDelete(product.id, product.images)}
                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================= */}
      {/* EDIT MODAL  */}
      {/* ======================================= */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">Quick Edit</h3>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Product Title</label>
                <input 
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Price (Ksh)</label>
                  <input 
                    type="number" 
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Stock Quantity</label>
                  <input 
                    type="number" 
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({...editForm, stock_quantity: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setEditingProduct(null)}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
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