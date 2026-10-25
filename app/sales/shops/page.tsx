"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { Shop } from "@/data/mockData";
import {
  Store,
  MapPin,
  Plus,
  Phone,
  Mic,
  ArrowRight,
  ArrowLeft,
  Search,
} from "lucide-react";

function ShopsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, villages, shops, selectedVillage, setSelectedVillage, setSelectedShop } = useApp();
  const t = translations[language];

  const villageParam = searchParams.get("village");
  const currentVillage = villages.find((v) => v.id === villageParam) || selectedVillage || villages[0];

  const [searchQuery, setSearchQuery] = useState("");

  const villageShops = shops.filter((s) => s.villageId === currentVillage.id);
  const filteredShops = villageShops.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
      (s.ownerEn && s.ownerEn.toLowerCase().includes(q))
    );
  });

  const handleStartOrder = (shop: Shop) => {
    setSelectedShop(shop);
    setSelectedVillage(currentVillage);
    router.push(`/sales/order/record?shop=${shop.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Active Village */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">
              {language === "mr" ? "निवडलेले गाव" : "Selected Village"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {language === "en" ? currentVillage.englishName : currentVillage.marathiName}{" "}
              <span className="text-sm font-semibold text-slate-500">
                ({language === "en" ? currentVillage.marathiName : currentVillage.englishName})
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/sales/villages")}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "mr" ? "गाव बदला" : "Switch Village"}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push(`/sales/shops/new?village=${currentVillage.id}`)}
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewShop}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === "mr" ? "दुकान किंवा मालकाचे नाव शोधा..." : "Search shops by name or owner..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      {/* Shop Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          {language === "mr" ? "या गावातील दुकाने" : "Shops in this Village"} ({filteredShops.length})
        </h2>

        {filteredShops.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm font-medium">
              {language === "mr" ? "या गावात कोणतीही दुकाने सापडली नाहीत." : "No shops found in this village."}
            </p>
            <button
              onClick={() => router.push(`/sales/shops/new?village=${currentVillage.id}`)}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
            >
              + {t.addNewShop}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map((shop) => {
              const displayName = language === "en" ? (shop.nameEn || shop.name) : shop.name;
              const displayOwner = language === "en" ? (shop.ownerEn || shop.owner) : shop.owner;
              const displayAddress = language === "en" ? (shop.addressEn || shop.address) : shop.address;

              return (
                <div
                  key={shop.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            {displayName}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <span>{t.shopOwner}:</span>
                            <strong className="text-slate-700">{displayOwner}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                      <p className="truncate text-slate-500">
                        📍 {displayAddress}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{shop.mobile}</span>
                      </p>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={() => handleStartOrder(shop)}
                    className="w-full mt-5 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition"
                  >
                    <Mic className="w-4 h-4 text-emerald-300" />
                    <span>{t.recordOrderForShop}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <ShopsContent />
    </Suspense>
  );
}
