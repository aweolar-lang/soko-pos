"use client";

import { supabase } from "@/lib/supabase"; 
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Store, LayoutGrid, Package, Receipt, Wallet, 
  Settings, LogOut, Menu, Bell, CreditCard, X 
} from "lucide-react";
import { useState, useEffect } from "react";

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

  // Close mobile menu automatically when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 mb-2">
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
          <Store className="h-6 w-6" />
          SokoPOS
        </div>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                isActive 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto border-t border-slate-100 shrink-0 bg-white">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-colors active:scale-[0.98]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 md:w-72 sticky top-0 h-screen bg-white border-r border-slate-200 z-10 shrink-0 shadow-sm">
        <NavContent />
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-3/4 max-w-xs bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 h-full">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        
        {/* FROSTED TOP HEADER */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0 supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-black text-lg text-slate-900 tracking-tight">SokoPOS</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            {/* Upgraded Avatar */}
            <button className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white hover:opacity-90 transition-opacity">
              S
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}