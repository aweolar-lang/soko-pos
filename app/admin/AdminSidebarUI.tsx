"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  DollarSign, 
  AlertTriangle, 
  RefreshCcw, 
  Store, 
  Menu, 
  X, 
  LogOut,
  ShieldCheck
} from "lucide-react";

export default function AdminSidebarUI({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Money Flow", href: "/admin/dashboard/transactions", icon: DollarSign },
    { name: "Disputes & Alerts", href: "/admin/dashboard/disputes", icon: AlertTriangle },
    { name: "Refunds", href: "/admin/dashboard/refunds", icon: RefreshCcw },
    { name: "Stores", href: "/admin/dashboard/stores", icon: Store },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <span className="font-black text-lg tracking-tight">Admin<span className="text-emerald-400">Panel</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        fixed md:sticky top-0 left-0 z-40
        w-64 h-screen bg-slate-900 text-slate-300
        transition-transform duration-300 ease-in-out
        flex flex-col flex-shrink-0
      `}>
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-slate-800">
          <div className="h-10 w-10 bg-emerald-500/20 flex items-center justify-center rounded-xl">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-black tracking-tight leading-none">SuperAdmin</h2>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">LocalSoko</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all
                  ${isActive ? "bg-emerald-500 text-white shadow-md shadow-emerald-900/20" : "hover:bg-slate-800 hover:text-white"}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-100" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <LogOut className="h-5 w-5" /> Exit to Platform
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full overflow-x-hidden">
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}
        {children}
      </main>
    </div>
  );
}