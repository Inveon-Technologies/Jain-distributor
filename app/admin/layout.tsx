"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { Logo } from "@/components/common/Logo";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Store,
  ClipboardList,
  Menu,
  X,
  LogOut,
  Bell,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, logout } = useApp();
  const t = translations[language];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navLinks = [
    {
      href: "/admin/dashboard",
      label: t.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: "/admin/salespersons",
      label: t.salespersons,
      icon: Users,
    },
    {
      href: "/admin/villages",
      label: t.villages,
      icon: MapPin,
    },
    {
      href: "/admin/shops",
      label: t.shops,
      icon: Store,
    },
    {
      href: "/admin/orders",
      label: t.orders,
      icon: ClipboardList,
    },
  ];

  return (
    <div className="min-h-screen bg-[#e8eee9] text-slate-800 flex flex-col lg:flex-row">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 sm:w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out shadow-sm ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
            <div onClick={() => router.push("/admin/dashboard")} className="cursor-pointer">
              <Logo size="default" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-5">
            <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3 block">
              {t.mainMenu}
            </span>
            <nav className="space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href || (link.href !== "/admin/dashboard" && pathname?.startsWith(link.href));
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-primary text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer with Inveon Logo */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/images/inveon-logo.jpeg"
                alt="Inveon Technologies"
                className="h-5 w-auto object-contain rounded"
              />
              <span className="text-[11px] font-semibold text-slate-500">
                Inveon Technologies
              </span>
            </div>
            <button
              onClick={handleLogout}
              title={t.logout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#e8eee9]">
        {/* Top Header */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Left: Mobile hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="text-slate-400">{t.brandName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-brand-dark font-bold">
                {pathname.includes("/admin/dashboard") && t.dashboard}
                {pathname.includes("/admin/salespersons") && t.salespersons}
                {pathname.includes("/admin/villages") && t.villages}
                {pathname.includes("/admin/shops") && t.shops}
                {pathname.includes("/admin/orders") && t.orders}
              </span>
            </div>
          </div>

          {/* Right: Language Switcher, Notifications, Admin Profile, Logout */}
          <div className="flex items-center gap-3 sm:gap-5">
            <LanguageToggle />

            {/* Notification Icon */}
            <div className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 cursor-pointer transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
            </div>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-100">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-brand-primary flex items-center justify-center font-bold border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-bold text-slate-900">
                  {t.adminRole}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {t.pandharpur}
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
        </header>

        {/* Child Pages Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
