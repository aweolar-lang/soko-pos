import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string | null;
  is_digital?: boolean;
}

interface CartState {
  storeId: string | null;
  items: CartItem[];
  _hasHydrated: boolean; // <-- PRODUCTION UPGRADE 1: Hydration safety
  
  // Actions
  setHasHydrated: (state: boolean) => void;
  addItem: (item: CartItem, newStoreId: string) => { success: boolean; error?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      items: [],
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addItem: (item, newStoreId) => {
        const state = get();

        // Check if cart has items from a different store
        if (state.storeId && state.storeId !== newStoreId && state.items.length > 0) {
          return {
            success: false,
            error: "Your cart contains items from a different store. Please complete or clear that order first."
          };
        }

        const existingItem = state.items.find((i) => i.id === item.id);
        
        if (existingItem) {
          // PRODUCTION UPGRADE 2: Prevent users from adding 10,000 items and crashing the checkout
          if (existingItem.quantity >= 99) {
            return { success: false, error: "Maximum quantity reached for this item." };
          }
          
          set({
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            storeId: newStoreId,
          });
        } else {
          set({
            items: [...state.items, { ...item, quantity: 1 }],
            storeId: newStoreId,
          });
        }
        return { success: true };
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.id !== productId);
        set({ items: newItems, storeId: newItems.length === 0 ? null : get().storeId });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1 || quantity > 99) return;
        set({
          items: get().items.map((i) =>
            i.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], storeId: null }),

      getTotal: () => {
        // PRODUCTION UPGRADE 3: Safe integer math rounding to prevent floating point errors (e.g. 10.999999999)
        const rawTotal = get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
        return Math.round(rawTotal * 100) / 100; 
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'localsoko-cart',
      // This tells Zustand to flip `_hasHydrated` to true once localStorage is loaded
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);