"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import {
  Search,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function AdminOrdersPage() {
  const router = useRouter();
  const { language, orders, shops, villages, salespersons } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillageFilter, setSelectedVillageFilter] = useState("ALL");

  const filteredOrders = orders.filter((order) => {
    const shop = shops.find((s) => s.id === order.shopId);
    const matchesSearch =
      order.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transcribedText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVillage =
      selectedVillageFilter === "ALL" || order.villageId === selectedVillageFilter;

    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {t.manageOrders}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "सर्व गावे व सेल्समन यांच्याकडून प्राप्त झालेल्या व्हॉईस ऑर्डर्सचे व्यवस्थापन करा."
              : "Review and monitor all incoming field sales orders and transcripts in real time."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold">
            {filteredOrders.length} {language === "mr" ? "एकूण ऑर्डर्स" : "Total Orders"}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "mr"
                ? "ऑर्डर क्रमांक, दुकान किंवा मजकूर शोधा..."
                : "Search by Order ID, shop name, or order text..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedVillageFilter}
            onChange={(e) => setSelectedVillageFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <option value="ALL">
              {t.allVillages}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {formatBilingual(v.marathiName, v.englishName, language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-3.5 px-4">{t.orderIdLabel}</th>
                <th className="py-3.5 px-4">{language === "mr" ? "दुकान / गाव" : "Shop / Village"}</th>
                <th className="py-3.5 px-4">{t.salespersons}</th>
                <th className="py-3.5 px-4">{t.recordedTextLabel}</th>
                <th className="py-3.5 px-4">{t.status}</th>
                <th className="py-3.5 px-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredOrders.map((order) => {
                const shop = shops.find((s) => s.id === order.shopId);
                const village = villages.find((v) => v.id === order.villageId);
                const sp = salespersons.find((s) => s.id === order.salespersonId);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-dark">
                      {order.displayId}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {order.createdAt}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block font-bold">
                        <BilingualName
                          mr={shop?.name}
                          en={shop?.nameEn}
                          secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                        />
                      </strong>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <BilingualName
                          mr={village?.marathiName}
                          en={village?.englishName}
                          secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                        />
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <BilingualName
                        mr={sp?.name}
                        en={sp?.nameEn}
                        secondaryClassName="text-xs font-normal text-slate-500 ml-1"
                      />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate text-xs font-semibold text-slate-800 bg-emerald-50/40 p-1.5 rounded-lg border border-emerald-100">
                        &ldquo;{order.transcribedText}&rdquo;
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t.confirmed}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="px-3 py-1.5 rounded-xl border border-brand-primary text-brand-primary hover:bg-emerald-50 font-bold text-xs flex items-center gap-1 mx-auto transition cursor-pointer"
                      >
                        <span>{t.viewDetails}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
