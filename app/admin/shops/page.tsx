"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
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
            {language === "mr" ? "दुकाने व्यवस्थापन" : "Retail Shops Management"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "सर्व गावातील नोंदणीकृत किराणा दुकानांची माहिती व शिल्लक व्यवस्थापित करा."
              : "Manage partner retail kirana stores, owner contacts, and credit balances."}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold self-start sm:self-auto">
          {shops.length} {language === "mr" ? "नोंदणीकृत दुकाने" : "Registered Stores"}
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
            {language === "mr" ? "सर्व गावे (All Villages)" : "All Villages"}
          </option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.marathiName} ({v.englishName})
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
                      {language === "en" ? (s.nameEn || s.name) : s.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {language === "en" ? (s.ownerEn || s.owner) : s.owner}
                    </span>
                  </div>
                </div>

                {s.outstandingBalance > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    ₹{s.outstandingBalance}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{language === "en" ? (v?.englishName || v?.marathiName) : v?.marathiName}</strong> • {language === "en" ? (s.addressEn || s.address) : s.address}
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
