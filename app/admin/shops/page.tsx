"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual } from "@/utils/transliterate";
import { Store, MapPin, Phone, Search } from "lucide-react";

export default function AdminShopsPage() {
  const { language, shops, villages } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("ALL");

  const filteredShops = shops.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
      (s.ownerEn && s.ownerEn.toLowerCase().includes(q));
    const matchesVillage =
      selectedVillageId === "ALL" || s.villageId === selectedVillageId;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {t.shops}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "सर्व गावांतील नोंदणीकृत किराणा दुकानांची माहिती व संपर्क व्यवस्थापित करा."
              : "Manage partner retail kirana stores, owner contacts, and locations."}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-white text-brand-primary border border-slate-200 text-xs font-bold self-start sm:self-auto shadow-xs">
          {shops.length} {t.totalStoresCount}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "mr" ? "दुकान किंवा मालकाचे नाव शोधा..." : "Search shops or owners..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        <select
          value={selectedVillageId}
          onChange={(e) => setSelectedVillageId(e.target.value)}
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

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShops.map((s) => {
          const v = villages.find((item) => item.id === s.villageId);
          return (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {formatBilingual(s.name, s.nameEn, language)}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {t.shopOwner}: {formatBilingual(s.owner, s.ownerEn, language)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{formatBilingual(v?.marathiName, v?.englishName, language)}</strong> • {language === "en" ? (s.addressEn || s.address) : s.address}
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{s.mobile}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
