"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import {
  Users,
  MapPin,
  Store,
  ClipboardList,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { language, villages, salespersons, orders, addVillage } = useApp();
  const t = translations[language];

  // Modal state for adding a village
  const [isAddVillageOpen, setIsAddVillageOpen] = useState(false);
  const [vMarathi, setVMarathi] = useState("");
  const [vEnglish, setVEnglish] = useState("");
  const [vTaluka, setVTaluka] = useState("");

  const handleAddVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vMarathi.trim()) return;
    addVillage({
      marathiName: vMarathi.trim(),
      englishName: vEnglish.trim() || vMarathi.trim(),
      taluka: vTaluka.trim() || "Pandharpur",
      district: "Solapur",
    });
    setVMarathi("");
    setVEnglish("");
    setVTaluka("");
    setIsAddVillageOpen(false);
  };

  const activeSalesCount = salespersons.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          {t.adminGreeting}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {t.adminOverview}
        </p>
      </div>

      {/* 4 KPI Summary Cards (As per PRD Section 4) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Salespersons */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {t.kpiActiveSalespersons}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-brand-dark">
                {activeSalesCount}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ {salespersons.length}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Village Visits */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {t.kpiVillageVisits}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-700 mt-0.5 block">
              28
            </span>
          </div>
        </div>

        {/* Card 3: Today's Shops Visited */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {t.kpiShopsVisited}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-700 mt-0.5 block">
              65
            </span>
          </div>
        </div>

        {/* Card 4: Today's Orders Recorded */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {t.kpiOrdersRecorded}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-brand-primary mt-0.5 block">
              {orders.length}
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Village Activity & Salesperson Management Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Village Activity Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-primary" />
                <span>{t.villageActivityTable}</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {language === "mr" ? "गाव निहाय विक्री व ऑर्डर्स अहवाल" : "Real-time orders by village"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddVillageOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addVillageBtn}</span>
            </button>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <th className="py-3 px-3 rounded-l-xl">
                    {language === "mr" ? "गाव (Village)" : "Village"}
                  </th>
                  <th className="py-3 px-3 text-center">
                    {language === "mr" ? "भेटी" : "Visits"}
                  </th>
                  <th className="py-3 px-3 text-center">
                    {language === "mr" ? "दुकाने" : "Shops"}
                  </th>
                  <th className="py-3 px-3 text-center rounded-r-xl">
                    {language === "mr" ? "ऑर्डर्स" : "Orders Taken"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {villages.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {v.marathiName}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        ({v.englishName})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{v.visitsToday}</td>
                    <td className="py-3 px-3 text-center font-semibold">{v.shopsCount}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-brand-primary font-bold text-xs">
                        {v.ordersToday}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Salesperson Management Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <span>{t.salespersonActivityTable}</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {language === "mr" ? "फील्ड सेल्समन दैनिक स्थिती" : "Daily field team performance"}
              </span>
            </div>

            <button
              onClick={() => router.push("/admin/salespersons")}
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>{language === "mr" ? "सर्व पहा" : "View All"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <th className="py-3 px-3 rounded-l-xl">
                    {language === "mr" ? "नाव" : "Name"}
                  </th>
                  <th className="py-3 px-3 text-center">
                    {language === "mr" ? "स्थिती" : "Status"}
                  </th>
                  <th className="py-3 px-3 text-center">
                    {language === "mr" ? "भेटी" : "Visits"}
                  </th>
                  <th className="py-3 px-3 text-center rounded-r-xl">
                    {language === "mr" ? "ऑर्डर्स" : "Orders"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {salespersons.map((sp) => (
                  <tr key={sp.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {sp.name}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {sp.nameEn}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          sp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {sp.status === "ACTIVE" ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{sp.todayVisits}</td>
                    <td className="py-3 px-3 text-center font-bold text-brand-primary">
                      {sp.todayOrders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand-primary" />
              <span>{language === "mr" ? "नुकत्याच नोंदवलेल्या व्हॉईस ऑर्डर्स" : "Recent Live Voice Orders"}</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {language === "mr" ? "फील्डमधून आलेले ताजे ऑर्डर्स" : "Latest incoming orders from field salesmen"}
            </span>
          </div>

          <button
            onClick={() => router.push("/admin/orders")}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
          >
            <span>{language === "mr" ? "सर्व ऑर्डर्स व्यवस्थापित करा" : "Manage All Orders"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.slice(0, 3).map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:bg-white transition cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-primary">
                  {order.id}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{order.createdAt}</span>
                </span>
              </div>

              <p className="text-xs font-bold text-slate-800 line-clamp-2">
                &ldquo;{order.transcribedText}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs font-semibold text-slate-500">
                <span>{order.items.length} {language === "mr" ? "साहित्य" : "Items"}</span>
                <span className="text-brand-primary flex items-center gap-1">
                  <span>{language === "mr" ? "तपशील पहा" : "Details"}</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Village Modal */}
      {isAddVillageOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">
              {t.addVillageBtn}
            </h3>
            <form onSubmit={handleAddVillage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  गाव नाव (मराठीत) *
                </label>
                <input
                  type="text"
                  required
                  value={vMarathi}
                  onChange={(e) => setVMarathi(e.target.value)}
                  placeholder="उदा. करकंब"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Village Name (in English)
                </label>
                <input
                  type="text"
                  value={vEnglish}
                  onChange={(e) => setVEnglish(e.target.value)}
                  placeholder="e.g. Karkamb"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  तालुका (Taluka)
                </label>
                <input
                  type="text"
                  value={vTaluka}
                  onChange={(e) => setVTaluka(e.target.value)}
                  placeholder="उदा. पंढरपूर"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVillageOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
