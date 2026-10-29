"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { BilingualName } from "@/components/common/BilingualName";
import {
  ClipboardList,
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Plus,
} from "lucide-react";

export default function TodayOrdersPage() {
  const router = useRouter();
  const { language, orders, shops, villages, currentUser } = useApp();
  const t = translations[language];

  // Filter orders for current salesperson
  const userOrders = orders.filter((o) => o.salespersonId === currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {t.todayOrdersTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {t.todayOrdersSubtitle} ({userOrders.length} {language === "mr" ? "ऑर्डर्स" : "Orders"})
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/sales/villages")}
          className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === "mr" ? "नवीन ऑर्डर नोंदवा" : "Record New Order"}</span>
        </button>
      </div>

      {/* Orders List */}
      {userOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-200 text-center space-y-3">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium text-sm">{t.noOrdersYet}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => {
            const shop = shops.find((s) => s.id === order.shopId);
            const village = villages.find((v) => v.id === order.villageId);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        <BilingualName
                          mr={shop?.name}
                          en={shop?.nameEn}
                          secondaryClassName="text-xs sm:text-sm font-normal text-slate-500 ml-1.5"
                        />
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <BilingualName
                          mr={village?.marathiName}
                          en={village?.englishName}
                          secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                        />
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {order.displayId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.confirmed}</span>
                    </span>
                  </div>
                </div>

                {/* Marathi Voice Text */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100/60 text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  &ldquo;{order.transcribedText}&rdquo;
                </div>

                {/* Items tags */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  {order.items.map((it, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Package className="w-3 h-3 text-slate-400" />
                      <span>
                        {it.name}: <strong>{it.quantity} {it.unit}</strong>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
