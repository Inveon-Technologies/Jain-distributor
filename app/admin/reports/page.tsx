"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { apiFetch, todayIST } from "@/lib/api";
import { BilingualName } from "@/components/common/BilingualName";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Package,
  MapPin,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  Store,
  Layers,
  Medal,
} from "lucide-react";

type PeriodType = "day" | "week" | "month" | "all";

interface SalespersonStat {
  salespersonId: string;
  name: string;
  nameEn: string | null;
  mobile: string;
  orderCount: number;
  totalQuantity: number;
  uniqueShops: number;
  uniqueVillages: number;
}

interface ItemStat {
  itemKey: string;
  name: string;
  unit: string;
  itemId: string | null;
  totalQuantity: number;
  orderCount: number;
}

interface VillageStat {
  villageId: string;
  villageName: string;
  villageNameEn: string;
  taluka: string;
  district: string;
  orderCount: number;
  uniqueShops: number;
  totalQuantity: number;
}

interface ReportData {
  period: PeriodType;
  date: string;
  label: string;
  range: { start: string; end: string };
  summary: {
    totalOrders: number;
    activeSalespersons: number;
    activeVillages: number;
    activeShops: number;
    totalQuantity: number;
  };
  salespersons: SalespersonStat[];
  items: ItemStat[];
  villages: VillageStat[];
}

export default function ReportsPage() {
  const { language } = useApp();
  const mr = language === "mr";

  const [period, setPeriod] = useState<PeriodType>("day");
  const [selectedDate, setSelectedDate] = useState(todayIST());
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"salespersons" | "items" | "villages">("salespersons");

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: ReportData }>(
        `/dashboard/reports?period=${period}&date=${selectedDate}`
      );
      setReport(res.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jd_token") : null;
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/dashboard/reports/export?period=${period}&date=${selectedDate}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `jain-distributor-report-${period}-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(mr ? "अहवाल डाउनलोड करताना त्रुटी आली." : "Could not export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const periodButtons: Array<{ id: PeriodType; labelMr: string; labelEn: string }> = [
    { id: "day", labelMr: "आजचा दिवस", labelEn: "Today" },
    { id: "week", labelMr: "हा आठवडा", labelEn: "This Week" },
    { id: "month", labelMr: "हा महिना", labelEn: "This Month" },
    { id: "all", labelMr: "सर्व वेळ", labelEn: "All Time" },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>{mr ? "विश्लेषण डॅशबोर्ड" : "Analytics Dashboard"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {mr ? "अहवाल व विश्लेषण" : "Sales & Items Report"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {mr
              ? "विक्रेता कामगिरी, सर्वाधिक मागणी असणारे साहित्य व जास्त ऑर्डर असणाऱ्या शहरांची यादी."
              : "Track salesperson performance, top ordered items, and highest performing cities."}
          </p>
        </div>

        {/* Action Button: Export */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadReport}
            title={mr ? "रिफ्रेश करा" : "Refresh"}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? (mr ? "डाउनलोड होत आहे..." : "Exporting...") : (mr ? "अहवाल CSV काढा" : "Export CSV")}</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
          {periodButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === btn.id
                  ? "bg-white text-brand-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {mr ? btn.labelMr : btn.labelEn}
            </button>
          ))}
        </div>

        {/* Date Selector for day-specific view */}
        {period === "day" && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{mr ? "तारीख:" : "Date:"}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {mr ? "एकूण ऑर्डर्स" : "Total Orders"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {loading ? "..." : report?.summary.totalOrders ?? 0}
            </span>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {mr ? "साहित्य प्रमाण" : "Total Units"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {loading ? "..." : report?.summary.totalQuantity ?? 0}
            </span>
          </div>
        </div>

        {/* Active Salespersons */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {mr ? "सक्रिय विक्रेते" : "Active Reps"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {loading ? "..." : report?.summary.activeSalespersons ?? 0}
            </span>
          </div>
        </div>

        {/* Villages Covered */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {mr ? "गावे / शहरे" : "Cities / Villages"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {loading ? "..." : report?.summary.activeVillages ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Lists (Tabs) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("salespersons")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "salespersons"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{mr ? "विक्रेता कामगिरी" : "Salespersons"}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "salespersons" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {report?.salespersons.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "items"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{mr ? "साहित्य मागणी यादी" : "Ordered Items"}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "items" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {report?.items.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("villages")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "villages"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{mr ? "शहरे / गावे (सर्वाधिक ऑर्डर्स)" : "Top Cities / Villages"}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "villages" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {report?.villages.length ?? 0}
            </span>
          </button>
        </div>

        {/* Tab 1: Salespersons List */}
        {activeTab === "salespersons" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-semibold">{mr ? "माहिती लोड होत आहे..." : "Loading data..."}</div>
            ) : !report?.salespersons.length ? (
              <div className="p-12 text-center text-slate-400">{mr ? "या कालावधीत कोणतीही विक्री नोंद नाही." : "No sales orders recorded in this period."}</div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">{mr ? "विक्रेत्याचे नाव" : "Salesperson"}</th>
                    <th className="py-3 px-4">{mr ? "मोबाईल" : "Mobile"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "ऑर्डर्स संख्या" : "Orders"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "एकूण नग/प्रमाण" : "Total Units"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "दुकाने" : "Shops"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "गावे" : "Villages"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.salespersons.map((sp, idx) => (
                    <tr key={sp.salespersonId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx === 0 && <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black mr-1">🥇 1</span>}
                        {idx === 1 && <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black mr-1">🥈 2</span>}
                        {idx === 2 && <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black mr-1">🥉 3</span>}
                        {idx > 2 && idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <BilingualName mr={sp.name} en={sp.nameEn} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{sp.mobile || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl font-black text-xs ${
                          sp.orderCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                        }`}>
                          {sp.orderCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{sp.totalQuantity}</td>
                      <td className="py-3 px-4 text-center text-slate-600 font-semibold">{sp.uniqueShops}</td>
                      <td className="py-3 px-4 text-center text-slate-600 font-semibold">{sp.uniqueVillages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Items List */}
        {activeTab === "items" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-semibold">{mr ? "साहित्य माहिती लोड होत आहे..." : "Loading items..."}</div>
            ) : !report?.items.length ? (
              <div className="p-12 text-center text-slate-400">{mr ? "या कालावधीत कोणतेही साहित्य नोंदवले गेले नाही." : "No items ordered in this period."}</div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">{mr ? "साहित्याचे नाव" : "Item Name"}</th>
                    <th className="py-3 px-4">{mr ? "एकक (Unit)" : "Unit"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "एकूण मागणी प्रमाण" : "Total Quantity"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "ऑर्डर्स संख्या" : "Order Frequency"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.items.map((item, idx) => (
                    <tr key={`${item.itemKey}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-xs text-slate-600">
                          {item.unit || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-sm text-brand-primary">
                          {item.totalQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-xs text-slate-700">
                          {item.orderCount} {mr ? "ऑर्डर्स" : "orders"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Villages / Cities List (Highest Orders) */}
        {activeTab === "villages" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-semibold">{mr ? "शहरांची माहिती लोड होत आहे..." : "Loading cities..."}</div>
            ) : !report?.villages.length ? (
              <div className="p-12 text-center text-slate-400">{mr ? "या कालावधीत शहरांची कोणतीही नोंद नाही." : "No city or village orders in this period."}</div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">{mr ? "शहर / गाव" : "City / Village"}</th>
                    <th className="py-3 px-4">{mr ? "तालुका / जिल्हा" : "Taluka / District"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "एकूण ऑर्डर्स" : "Total Orders"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "एकूण साहित्य नग" : "Total Units"}</th>
                    <th className="py-3 px-4 text-center">{mr ? "सक्रिय दुकाने" : "Active Shops"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.villages.map((vg, idx) => (
                    <tr key={vg.villageId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx === 0 && <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black mr-1">🥇 1</span>}
                        {idx === 1 && <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black mr-1">🥈 2</span>}
                        {idx === 2 && <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black mr-1">🥉 3</span>}
                        {idx > 2 && idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <BilingualName mr={vg.villageName} en={vg.villageNameEn} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {vg.taluka ? `${vg.taluka}, ` : ""}{vg.district || "सोलापूर"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                          {vg.orderCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {vg.totalQuantity}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600">
                        {vg.uniqueShops}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
