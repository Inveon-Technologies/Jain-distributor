"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { Logo } from "@/components/common/Logo";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useRequireRole } from "@/components/common/useRequireRole";
import { BilingualName } from "@/components/common/BilingualName";
import { formatBilingual } from "@/utils/transliterate";
import {
  Home,
  MapPin,
  ClipboardList,
  User,
  LogOut,
} from "lucide-react";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, currentUser, logout } = useApp();
  const t = translations[language];
  const allowed = useRequireRole("SALESPERSON");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navItems = [
    { href: "/sales/home", label: t.home, icon: Home },
    { href: "/sales/villages", label: t.villages, icon: MapPin },
    { href: "/sales/orders/today", label: t.todayOrders, icon: ClipboardList },
    { href: "/sales/profile", label: t.profile, icon: User },
  ];

  const salespersonDisplayName = formatBilingual(
    currentUser?.name || "",
    currentUser?.nameEn || "",
    language
  );

  if (!allowed) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">लोड होत आहे...</div>;
  }

  return (
    <div className="min-h-screen bg-[#e8eee9] flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div onClick={() => router.push("/sales/home")} className="cursor-pointer">
            <Logo size="default" />
          </div>

          {/* Right Controls: Language + Salesperson Profile + Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageToggle />

            {/* User Badge */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center text-brand-primary font-bold border border-emerald-200 shadow-xs">
                  <User className="w-5 h-5 text-brand-primary" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="hidden sm:flex flex-col leading-tight max-w-[200px]">
                <span className="text-xs font-bold text-slate-900 truncate" title={salespersonDisplayName}>
                  <BilingualName
                    mr={currentUser?.name || ""}
                    en={currentUser?.nameEn || ""}
                    secondaryClassName="text-[11px] font-normal text-slate-500 ml-1"
                  />
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {t.salesRole}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title={t.logout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="border-t border-slate-100 bg-[#fafcfb] hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex gap-1 sm:gap-2 py-1.5 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/sales/home" && pathname?.startsWith(item.href));
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-primary text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Very convenient for field sales reps on phones!) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 z-40 shadow-lg flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/sales/home" && pathname?.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                isActive ? "text-brand-primary font-bold" : "text-slate-400 font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
