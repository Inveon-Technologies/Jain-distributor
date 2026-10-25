"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { ArrowLeft, Check } from "lucide-react";

function AddNewShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, villages, selectedVillage, addShop } = useApp();
  const t = translations[language];

  const defaultVillageId = searchParams.get("village") || selectedVillage?.id || villages[0].id;

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [owner, setOwner] = useState("");
  const [ownerEn, setOwnerEn] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [villageId, setVillageId] = useState(defaultVillageId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalName = name.trim();
    const finalNameEn = nameEn.trim() || finalName;
    const finalOwner = owner.trim() || (language === "mr" ? "दुकानदार" : "Shopkeeper");
    const finalOwnerEn = ownerEn.trim() || finalOwner;
    const finalAddress = address.trim() || (language === "mr" ? "मुख्य रस्ता" : "Main Road");
    const finalAddressEn = addressEn.trim() || finalAddress;

    addShop({
      name: finalName,
      nameEn: finalNameEn,
      owner: finalOwner,
      ownerEn: finalOwnerEn,
      mobile: mobile.trim() || "+91 98000 00000",
      address: finalAddress,
      addressEn: finalAddressEn,
      villageId,
      outstandingBalance: 0,
    });

    router.push(`/sales/shops?village=${villageId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.newShopTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {language === "mr" ? "गावात नवीन किराणा दुकानाची नोंदणी करा" : "Register a newly visited retail store"}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        {/* Village Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {language === "mr" ? "गाव निवडा" : "Village"} *
          </label>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marathiName} ({v.englishName})
              </option>
            ))}
          </select>
        </div>

        {/* Shop Name Fields (Marathi & English) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "दुकान नाव (मराठी)" : "Shop Name"} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "mr" ? "उदा. श्री महालक्ष्मी किराणा" : "e.g. Shri Mahalaxmi Kirana"}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "दुकान नाव (इंग्रजीत / पर्यायी)" : "Shop Name (English / Optional)"}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Shri Mahalaxmi Kirana"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>

        {/* Owner Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "मालकाचे नाव" : "Owner Name"}
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder={language === "mr" ? "उदा. रमेश पाटील" : "e.g. Ramesh Patil"}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "मालकाचे नाव (इंग्रजीत / पर्यायी)" : "Owner Name (English / Optional)"}
            </label>
            <input
              type="text"
              value={ownerEn}
              onChange={(e) => setOwnerEn(e.target.value)}
              placeholder="e.g. Ramesh Patil"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
            placeholder="+91 98XXX XXXXX"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.addressLabel}
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={language === "mr" ? "उदा. शिवाजी पुतळ्याजवळ, मुख्य रस्ता" : "e.g. Near bus stop, Main Road"}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {language === "mr" ? "पत्ता (इंग्रजीत / पर्यायी)" : "Address (English / Optional)"}
            </label>
            <textarea
              rows={2}
              value={addressEn}
              onChange={(e) => setAddressEn(e.target.value)}
              placeholder="e.g. Near Bus Stand, Main Road"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-700 transition"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep font-bold text-sm text-white shadow-md active:scale-[0.99] transition flex items-center justify-center gap-2"
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
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <AddNewShopContent />
    </Suspense>
  );
}
