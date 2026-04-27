"use client";

import { supabase } from "@/lib/supabase"; 
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Store, LayoutGrid, Package, Receipt, Wallet, 
  Settings, LogOut, Menu, Bell, CreditCard, X, Loader2, HelpCircle, BookOpen, Clock, CheckCircle2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Dropdown states
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Notification states
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  // Fetch Pending Orders for the Bell Icon & Dropdown
  useEffect(() => {
    async function fetchAlerts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        // Fetch count AND the top 5 actual orders
        const { data: orders, count } = await supabase
          .from('orders')
          .select('id, amount_paid, created_at', { count: 'exact' })
          .eq('store_id', store.id)
          .neq('status', 'COMPLETED')
          .neq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(5); // Just grab the 5 most recent for the preview
        
        setPendingOrdersCount(count || 0);
        setPendingOrders(orders || []);
      }
    }
    
    fetchAlerts();
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  };

  const currentPageName = navLinks.find(link => link.href === pathname)?.name || "Dashboard";

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 mb-2">
        <Link href="/" className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight">
           <Store className="h-6 w-6" />
           SokoPOS
        </Link>
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
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <LogOut className="h-5 w-5 shrink-0" />}
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 md:w-72 sticky top-0 h-screen bg-white border-r border-slate-200 z-10 shrink-0 shadow-sm print:hidden">
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* FROSTED TOP HEADER */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0 supports-[backdrop-filter]:bg-white/60 print:hidden">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/" className="font-black text-lg text-slate-900 tracking-tight">
                SokoPOS
              </Link>
            </div>
            
            <span className="font-black text-xl text-slate-900 tracking-tight hidden lg:block">
              {currentPageName}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            
            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative" ref={notifDropdownRef}>
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileMenuOpen(false); 
                }}
                className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors outline-none"
              >
                <Bell className="h-5 w-5" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center px-1 rounded-full bg-red-500 border-2 border-white text-[9px] font-black text-white">
                    {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    {pendingOrdersCount > 0 && (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        {pendingOrdersCount} Pending
                      </span>
                    )}
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto">
                    {pendingOrders.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 flex flex-col items-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-1">You have no pending orders.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {pendingOrders.map((order) => (
                          <div key={order.id} className="p-3 hover:bg-slate-50 transition-colors flex gap-3">
                            <div className="bg-amber-100 text-amber-600 p-2 rounded-full h-fit shrink-0">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                New Order Received
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                Order #{order.id.slice(0, 8)} needs fulfillment.
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 mt-1">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Footer */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50">
                    <Link 
                      href="/dashboard/orders"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="block w-full py-2 text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      View All Orders
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationsOpen(false); // Close the other dropdown
                }}
                className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white hover:opacity-90 transition-opacity outline-none"
              >
                S
              </button>

             {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-900">My Account</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    
                    <Link 
                      href="/dashboard/guide"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <BookOpen className="h-4 w-4" /> Payout Guide
                    </Link>

                    <button 
                      onClick={() => alert("Support Center opening soon!")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" /> Support
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
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