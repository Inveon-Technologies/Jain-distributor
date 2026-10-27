"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { autoBilingualName } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import { Village } from "@/data/mockData";
import { MapPin, Plus, X, Check, Trash2 } from "lucide-react";

export default function AdminVillagesPage() {
  const { language, villages, addVillage, deleteVillage } = useApp();
  const t = translations[language];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [villageToDelete, setVillageToDelete] = useState<Village | null>(null);
  const [villageName, setVillageName] = useState("");
  const [taluka, setTaluka] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim()) return;

    const vPair = autoBilingualName(villageName);
    const talukaPair = autoBilingualName(taluka || (language === "mr" ? "पंढरपूर" : "Pandharpur"));

    addVillage({
      marathiName: vPair.mr,
      englishName: vPair.en,
      taluka: language === "mr" ? talukaPair.mr : talukaPair.en,
      district: language === "mr" ? "सोलापूर" : "Solapur",
    });

    setVillageName("");
    setTaluka("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {t.villages}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "विक्री नेटवर्कमधील सर्व गावे व त्यातील कार्यक्षेत्र व्यवस्थापित करा."
              : "Manage covered village territories, shop densities, and regional visits."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addVillageBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {villages.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    <BilingualName
                      mr={v.marathiName}
                      en={v.englishName}
                      secondaryClassName="text-xs sm:text-sm font-normal text-slate-500 ml-1.5"
                    />
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {language === "mr" ? `${v.taluka}, सोलापूर` : `${v.taluka}, Solapur`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVillageToDelete(v)}
                title={t.deleteVillage}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block font-medium">
                  {t.shops}
                </span>
                <span className="text-base font-extrabold text-slate-800">
                  {v.shopsCount}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block font-medium">
                  {t.visits}
                </span>
                <span className="text-base font-extrabold text-slate-800">
                  {v.visitsToday}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block font-medium">
                  {t.orders}
                </span>
                <span className="text-base font-extrabold text-brand-primary">
                  {v.ordersToday}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Village Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t.newVillageModalTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {t.newVillageModalSubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  {t.villageNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder={language === "mr" ? "उदा. कोल्हापूर / Kolhapur" : "e.g. Kolhapur, Hatkanangale"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  {t.talukaLabel}
                </label>
                <input
                  type="text"
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  placeholder={language === "mr" ? "उदा. पंढरपूर / Pandharpur" : "e.g. Pandharpur"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveVillageBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {villageToDelete && (
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
                <span className="text-xs text-slate-600 font-medium block truncate max-w-[200px]">
                  <BilingualName
                    mr={villageToDelete.marathiName}
                    en={villageToDelete.englishName}
                    className="font-bold text-slate-800"
                    secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                  />
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.deleteVillageConfirmMsg}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setVillageToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteVillage(villageToDelete.id);
                  setVillageToDelete(null);
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
