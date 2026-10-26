"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { BilingualName } from "@/components/common/BilingualName";
import { CheckCircle2, Store, ClipboardList } from "lucide-react";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, orders, shops, selectedVillage } = useApp();
  const t = translations[language];

  const orderId = searchParams.get("orderId");
  const currentOrder = orders.find((o) => o.id === orderId) || orders[0];
  const orderShop = shops.find((s) => s.id === currentOrder?.shopId);

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6 text-center">
      {/* Animated Checkmark Badge */}
      <div className="relative inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-100 text-brand-primary mx-auto shadow-inner">
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping duration-1000"></div>
        <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-brand-primary" />
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">
          {t.orderSuccessTitle}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium mt-1.5 max-w-md mx-auto">
          {t.orderSuccessSubtitle}
        </p>
      </div>

      {/* Order Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">
              {t.orderIdLabel}
            </span>
            <span className="text-xl font-extrabold text-brand-primary font-mono">
              {currentOrder?.id}
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold">
            ✓ {t.confirmed}
          </span>
        </div>

        {/* Shop details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">{language === "mr" ? "दुकान" : "Shop"}:</span>
            <BilingualName
              mr={orderShop?.name}
              en={orderShop?.nameEn}
              className="text-slate-900 font-bold"
              secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{language === "mr" ? "एकूण साहित्य" : "Total Items"}:</span>
            <strong className="text-slate-900">{currentOrder?.items.length} {language === "mr" ? "वस्तू" : "Items"}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{language === "mr" ? "वेळ" : "Timestamp"}:</span>
            <strong className="text-slate-700">{currentOrder?.createdAt}</strong>
          </div>
        </div>

        {/* Marathi speech snippet */}
        <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-600 font-medium italic border border-slate-100">
          &ldquo;{currentOrder?.transcribedText}&rdquo;
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/sales/shops?village=${selectedVillage?.id || "v-1"}`)}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition"
        >
          <Store className="w-5 h-5" />
          <span>{t.nextShopVisit}</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/sales/orders/today")}
          className="flex-1 py-3.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition"
        >
          <ClipboardList className="w-5 h-5 text-slate-500" />
          <span>{t.todayOrdersTitle}</span>
        </button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
