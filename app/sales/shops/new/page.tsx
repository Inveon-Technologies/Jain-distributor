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

  const [nameEn, setNameEn] = useState("");
  const [nameMr, setNameMr] = useState("");
  const [ownerEn, setOwnerEn] = useState("");
  const [ownerMr, setOwnerMr] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [addressMr, setAddressMr] = useState("");
  const [villageId, setVillageId] = useState(defaultVillageId);

  const handleEnNameChange = (val: string) => {
    setNameEn(val);
    if (!nameMr || nameMr === autoBilingualName(nameEn).mr) {
      setNameMr(autoBilingualName(val).mr);
    }
  };

  const handleMrNameChange = (val: string) => {
    setNameMr(val);
    if (!nameEn || nameEn === autoBilingualName(nameMr).en) {
      setNameEn(autoBilingualName(val).en);
    }
  };

  const handleEnOwnerChange = (val: string) => {
    setOwnerEn(val);
    if (!ownerMr || ownerMr === autoBilingualName(ownerEn).mr) {
      setOwnerMr(autoBilingualName(val).mr);
    }
  };

  const handleMrOwnerChange = (val: string) => {
    setOwnerMr(val);
    if (!ownerEn || ownerEn === autoBilingualName(ownerMr).en) {
      setOwnerEn(autoBilingualName(val).en);
    }
  };

  const handleEnAddressChange = (val: string) => {
    setAddressEn(val);
    if (!addressMr || addressMr === autoBilingualName(addressEn).mr) {
      setAddressMr(autoBilingualName(val).mr);
    }
  };

  const handleMrAddressChange = (val: string) => {
    setAddressMr(val);
    if (!addressEn || addressEn === autoBilingualName(addressMr).en) {
      setAddressEn(autoBilingualName(val).en);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNameMr = nameMr.trim() || autoBilingualName(nameEn).mr;
    const finalNameEn = nameEn.trim() || autoBilingualName(nameMr).en;
    if (!finalNameMr && !finalNameEn) return;

    const finalOwnerMr = ownerMr.trim() || autoBilingualName(ownerEn).mr || (language === "mr" ? "दुकानदार" : "Shopkeeper");
    const finalOwnerEn = ownerEn.trim() || autoBilingualName(ownerMr).en || "Shopkeeper";

    const finalAddressMr = addressMr.trim() || autoBilingualName(addressEn).mr || (language === "mr" ? "मुख्य रस्ता" : "Main Road");
    const finalAddressEn = addressEn.trim() || autoBilingualName(addressMr).en || "Main Road";

    addShop({
      name: finalNameMr,
      nameEn: finalNameEn,
      owner: finalOwnerMr,
      ownerEn: finalOwnerEn,
      mobile: mobile.trim() || "+91 98000 00000",
      address: finalAddressMr,
      addressEn: finalAddressEn,
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
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-xs"
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

        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3 text-xs text-emerald-800 flex items-start gap-2 font-medium">
          <span className="text-base">⚡</span>
          <span>{t.dualLanguageHelp}</span>
        </div>

        {/* Shop Name - English & Marathi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.shopNameEnLabel} *
            </label>
            <input
              type="text"
              required={!nameMr}
              value={nameEn}
              onChange={(e) => handleEnNameChange(e.target.value)}
              placeholder="e.g. Shri Mahalaxmi Kirana"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.shopNameMrLabel} *
            </label>
            <input
              type="text"
              required={!nameEn}
              value={nameMr}
              onChange={(e) => handleMrNameChange(e.target.value)}
              placeholder="उदा. श्री महालक्ष्मी किराणा"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium font-marathi"
            />
          </div>
        </div>

        {/* Owner Name - English & Marathi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.ownerNameEnLabel}
            </label>
            <input
              type="text"
              value={ownerEn}
              onChange={(e) => handleEnOwnerChange(e.target.value)}
              placeholder="e.g. Ramesh Patil / Ankita Utture"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.ownerNameMrLabel}
            </label>
            <input
              type="text"
              value={ownerMr}
              onChange={(e) => handleMrOwnerChange(e.target.value)}
              placeholder="उदा. रमेश पाटील / अंकिता उत्तुरे"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium font-marathi"
            />
          </div>
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
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
          />
        </div>

        {/* Address - English & Marathi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "पत्ता (English)" : "Address (English)"}
            </label>
            <textarea
              rows={2}
              value={addressEn}
              onChange={(e) => handleEnAddressChange(e.target.value)}
              placeholder="e.g. Near Bus Stand, Main Road"
              className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "पत्ता (मराठी)" : "Address (Marathi)"}
            </label>
            <textarea
              rows={2}
              value={addressMr}
              onChange={(e) => handleMrAddressChange(e.target.value)}
              placeholder="उदा. बस स्टँड जवळ, मुख्य रस्ता"
              className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium font-marathi"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-700 transition"
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
