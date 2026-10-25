"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import {
  User,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Award,
} from "lucide-react";

export default function SalesProfilePage() {
  const router = useRouter();
  const { language, currentUser, logout, orders, villages } = useApp();
  const t = translations[language];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const userOrders = orders.filter((o) => o.salespersonId === currentUser?.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card Header */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-deep rounded-3xl p-6 sm:p-8 text-white relative shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border-2 border-emerald-400/30 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            <User className="w-12 h-12 text-emerald-200" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>{t.salesRole}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === "mr" ? currentUser?.name || "अमोल पाटील" : currentUser?.nameEn || "Amol Patil"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser?.email || "amol@jain.com"}</span>
            </p>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium flex items-center justify-center sm:justify-start gap-2">
              <Phone className="w-3.5 h-3.5" />
              <span>{currentUser?.mobile || "+91 98220 12345"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
            {t.totalOrdersToday}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-brand-primary">
            {userOrders.length}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {language === "mr" ? "यशस्वीरीत्या नोंदवल्या" : "Successfully logged"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
            {t.totalVisitsToday}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800">
            8
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {language === "mr" ? "दुकानांना भेटी" : "Stores Visited"}
          </span>
        </div>
      </div>

      {/* Assigned Route Territories */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-primary" />
          <span>{language === "mr" ? "नेमून दिलेली गावे (Assigned Villages)" : "Assigned Territories"}</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {villages.slice(0, 3).map((v) => (
            <span
              key={v.id}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-brand-primary text-xs font-bold"
            >
              📍 {v.marathiName} ({v.englishName})
            </span>
          ))}
        </div>
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>{t.logout}</span>
      </button>
    </div>
  );
}
