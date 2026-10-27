"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { autoBilingualName, formatBilingual } from "@/utils/transliterate";
import { ArrowLeft, Check, Store } from "lucide-react";

function AddNewShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, villages, selectedVillage, addShop } = useApp();
  const t = translations[language];

  const defaultVillageId = searchParams.get("village") || selectedVillage?.id || villages[0].id;

  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [villageId, setVillageId] = useState(defaultVillageId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const namePair = autoBilingualName(name);
    const ownerPair = autoBilingualName(owner || (language === "mr" ? "दुकानदार" : "Shopkeeper"));
    const addressPair = autoBilingualName(address || (language === "mr" ? "मुख्य रस्ता" : "Main Road"));

    addShop({
      name: namePair.mr,
      nameEn: namePair.en,
      owner: ownerPair.mr,
      ownerEn: ownerPair.en,
      mobile: mobile.trim() || "+91 98000 00000",
      address: addressPair.mr,
      addressEn: addressPair.en,
      villageId,
      outstandingBalance: 0,
    });

    router.push(`/sales/shops?village=${villageId}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-brand-primary" />
            <span>{t.newShopTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {t.newShopSubtitle}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        {/* Village Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.selectVillagePrompt} *
          </label>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {formatBilingual(v.marathiName, v.englishName, language)}
              </option>
            ))}
          </select>
        </div>

        {/* Shop Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.shopNameLabel} *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={language === "mr" ? "उदा. श्री महालक्ष्मी किराणा / Shri Mahalaxmi Kirana" : "e.g. Shri Mahalaxmi Kirana"}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.ownerNameLabel}
          </label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder={language === "mr" ? "उदा. वर्षा पाटील / Varsha Patil / Kedar" : "e.g. Ramesh Patil / Varsha Patil"}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.mobileLabel}
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder={t.mobilePlaceholder}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.addressLabel}
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={language === "mr" ? "उदा. बस स्टँड जवळ, मुख्य रस्ता" : "e.g. Near Bus Stand, Main Road"}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-700 transition cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-2xl bg-brand-primary hover:bg-brand-deep font-bold text-sm text-white shadow-md active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveShopBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddNewShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
      <AddNewShopContent />
    </Suspense>
  );
}
