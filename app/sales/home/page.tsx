"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { MapPin, Store, Mic, ArrowRight, TrendingUp } from "lucide-react";

export default function SalesHomePage() {
  const router = useRouter();
  const { language, currentUser, orders, selectedVillage } = useApp();
  const t = translations[language];

  // Count orders taken today by current user
  const todayOrdersCount = orders.filter((o) => o.salespersonId === currentUser?.id).length;

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <span>{t.salesWelcome}, {language === "mr" ? currentUser?.name : currentUser?.nameEn}!</span>
            <span className="text-2xl animate-bounce">👋</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            {t.salesSubtitle}
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">
              {language === "mr" ? "आजच्या ऑर्डर्स" : "Orders Today"}
            </span>
            <span className="text-lg font-black text-brand-dark">
              {todayOrdersCount} {language === "mr" ? "नोंदवल्या" : "Recorded"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Action Hero Card (गाव निवडा) */}
      <section className="bg-gradient-to-br from-white to-[#edf7f1] rounded-3xl border border-emerald-200/80 p-5 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-primary text-xs font-bold mb-4">
            <MapPin className="w-4 h-4" />
            <span>{language === "mr" ? "पहिली पायरी" : "First Step"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            {t.selectVillage}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 leading-relaxed">
            {language === "mr"
              ? "दुकानदारांच्या भेटी आणि नवीन व्हॉईस ऑर्डर्स नोंदवण्यासाठी प्रथम तुमचे नियोजित गाव निवडा."
              : "Select your scheduled village territory to view shops, record voice orders, and log visits."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/sales/villages")}
            className="mt-6 py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-brand-primary/25 active:scale-[0.99] transition"
          >
            <span>{t.selectVillage}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 3 Steps Process Explanation */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-brand-primary flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            {t.howItWorks}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div
            onClick={() => router.push("/sales/villages")}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-brand-primary font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {t.step1Title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t.step1Desc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-primary flex items-center gap-1">
              <span>{language === "mr" ? "गाव निवडा" : "Select"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => router.push(`/sales/shops?village=${selectedVillage?.id || "v-1"}`)}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <Store className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {t.step2Title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t.step2Desc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-700 flex items-center gap-1">
              <span>{language === "mr" ? "दुकाने पहा" : "View Shops"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => router.push("/sales/order/record")}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <Mic className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {t.step3Title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t.step3Desc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-700 flex items-center gap-1">
              <span>{language === "mr" ? "ऑर्डर बोला" : "Speak Order"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
