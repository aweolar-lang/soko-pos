"use client";

import { supabase } from "@/lib/supabase"; 
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Store, LayoutGrid, Package, Receipt, Wallet, 
  Settings, LogOut, Menu, Bell, CreditCard, X 
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { name: "Point of Sale", href: "/dashboard", icon: LayoutGrid },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package },
  { name: "Orders", href: "/dashboard/orders", icon: Receipt },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Store Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 mb-4">
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
          <Store className="h-6 w-6" />
          SokoPOS
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isActive 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto border-t border-slate-100 shrink-0">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    // 1. Standard flex container. No internal app-shell scrolling traps here.
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      
      {/* DESKTOP SIDEBAR - FIXED: Changed from 'fixed inset-y-0' to 'sticky top-0 h-screen' */}
      <aside className="hidden md:flex flex-col w-64 sticky top-0 h-screen bg-white border-r border-slate-200 z-10 shrink-0">
        <NavContent />
      </aside>

      {/* MOBILE SIDEBAR (Must remain fixed so it pops over the screen when opened) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 h-full">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400"
            >
              <X className="h-6 w-6" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* MAIN CONTENT - FIXED: Removed the hacky md:ml-64. Natural flexbox handles this now. */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-bold text-lg text-slate-900">SokoPOS</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">
              D
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>

      </div>
    </div>
  );
}