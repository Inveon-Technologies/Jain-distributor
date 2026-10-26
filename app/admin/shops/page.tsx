"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual } from "@/utils/transliterate";
import { Shop } from "@/data/mockData";
import { Store, MapPin, Phone, Search, Trash2 } from "lucide-react";

export default function AdminShopsPage() {
  const { language, shops, villages, deleteShop } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("ALL");
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);

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
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4 flex flex-col justify-between"
            >
              <div>
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

                  <button
                    type="button"
                    onClick={() => setShopToDelete(s)}
                    title={t.deleteShop}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600 mt-3">
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
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {shopToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t.deleteConfirmTitle}
                </h3>
                <span className="text-xs text-slate-400 font-medium block truncate max-w-[200px]">
                  {formatBilingual(shopToDelete.name, shopToDelete.nameEn, language)}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.deleteShopConfirmMsg}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShopToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteShop(shopToDelete.id);
                  setShopToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {t.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
