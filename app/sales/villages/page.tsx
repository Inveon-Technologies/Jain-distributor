"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { Village } from "@/data/mockData";
import { BilingualName } from "@/components/common/BilingualName";
import { MapPin, Store, ArrowRight, CheckCircle2 } from "lucide-react";

export default function VillagesSelectionPage() {
  const router = useRouter();
  const { language, villages, selectedVillage, setSelectedVillage } = useApp();
  const t = translations[language];

  const handleSelectVillage = (village: Village) => {
    setSelectedVillage(village);
    router.push(`/sales/shops?village=${village.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-brand-primary text-xs font-bold mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{language === "mr" ? "पायरी १" : "Step 1"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          {t.selectVillage}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
          {t.villageSubtitle}
        </p>
      </div>

      {/* Village Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {villages.map((village) => {
          const isSelected = selectedVillage?.id === village.id;
          return (
            <div
              key={village.id}
              onClick={() => handleSelectVillage(village)}
              className={`bg-white rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? "border-brand-primary ring-2 ring-brand-primary/20 bg-emerald-50/20"
                  : "border-slate-200/80 hover:border-emerald-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        isSelected ? "bg-brand-primary text-white" : "bg-emerald-100 text-brand-primary"
                      }`}
                    >
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        <BilingualName
                          mr={village.marathiName}
                          en={village.englishName}
                          secondaryClassName="text-sm font-normal text-slate-400 ml-1.5"
                        />
                      </h3>
                      <span className="text-xs font-semibold text-slate-400">
                        {language === "mr" ? `तालुका: ${village.taluka}` : `Taluka: ${village.taluka}`}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="p-1 rounded-full bg-emerald-100 text-brand-primary">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  )}
                </div>

                {/* Village Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block font-medium">
                      {t.shopsAvailable}
                    </span>
                    <span className="text-base font-extrabold text-slate-800">
                      {village.shopsCount}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block font-medium">
                      {t.ordersRecorded}
                    </span>
                    <span className="text-base font-extrabold text-brand-primary">
                      {village.ordersToday}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Store className="w-4 h-4" />
                <span>{t.selectShop}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
