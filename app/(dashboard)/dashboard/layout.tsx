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
      <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
          <Store className="h-6 w-6" />
          SokoPOS
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="h-5 w-5 text-slate-400" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-30">
        <NavContent />
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
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

      {/* MAIN CONTENT */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
            </button>
            <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">
              S
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}