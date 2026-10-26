"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import {
  ArrowLeft,
  Store,
  User,
  Mic,
  Package,
  CheckCircle2,
} from "lucide-react";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { language, orders, shops, villages, salespersons } = useApp();
  const t = translations[language];

  const order = orders.find((o) => o.id === orderId) || orders[0];
  const shop = shops.find((s) => s.id === order?.shopId);
  const village = villages.find((v) => v.id === order?.villageId);
  const salesperson = salespersons.find((s) => s.id === order?.salespersonId);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/admin/orders")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-deep mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "mr" ? "ऑर्डर्स यादीकडे परत" : "Back to Orders"}</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              {t.orderDetails}
            </h1>
            <span className="font-mono text-sm px-3 py-1 rounded-xl bg-slate-100 font-bold text-slate-700">
              {order?.id}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "रेकॉर्ड केलेली व्हॉईस ऑर्डर आणि संबंधित दुकानाची संपूर्ण माहिती."
              : "Review the voice-transcribed order and associated retail shop information."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.confirmed}</span>
          </span>
        </div>
      </div>

      {/* Prominent Recorded Order Voice-to-Text Box (Matching Section 4 & order_details UI) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t.recordedTextLabel}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Source: Marathi speech-to-text engine (`mr-IN`)
            </span>
          </div>
        </div>

        {/* Big Marathi Speech Text */}
        <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-900 text-xl sm:text-2xl font-bold leading-relaxed font-marathi">
          &ldquo;{order?.transcribedText}&rdquo;
        </div>
      </section>

      {/* 3 Information Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Shop Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "mr" ? "दुकानाची माहिती" : "Shop Information"}
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "दुकानाचे नाव" : "Shop Name"}
              </span>
              <strong className="text-slate-900 font-bold block mt-0.5">
                <BilingualName
                  mr={shop?.name}
                  en={shop?.nameEn}
                  secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                />
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "गाव" : "Village"}
              </span>
              <span className="text-slate-800 font-bold block mt-0.5">
                <BilingualName
                  mr={village?.marathiName}
                  en={village?.englishName}
                  secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                />
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "मालक / संपर्क" : "Owner / Mobile"}
              </span>
              <span className="text-slate-800 font-semibold block mt-0.5">
                <BilingualName
                  mr={shop?.owner}
                  en={shop?.ownerEn}
                  secondaryClassName="text-xs font-normal text-slate-500 ml-1"
                />
                {" "}• {shop?.mobile}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "पत्ता" : "Address"}
              </span>
              <span className="text-slate-600 block mt-0.5">
                {language === "en" ? (shop?.addressEn || shop?.address) : shop?.address}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Salesperson Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-slate-100 border-b">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "mr" ? "सेल्समन माहिती" : "Salesperson Information"}
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "नाव" : "Salesperson Name"}
              </span>
              <strong className="text-slate-900 font-bold block mt-0.5">
                <BilingualName
                  mr={salesperson?.name}
                  en={salesperson?.nameEn}
                  secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                />
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "मोबाईल" : "Phone"}
              </span>
              <span className="text-slate-800 font-semibold block mt-0.5">
                {salesperson?.mobile || "+91 98220 12345"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "ई-मेल" : "Email"}
              </span>
              <span className="text-slate-800 font-semibold block mt-0.5">
                {salesperson?.email || "amol@jain.com"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                {language === "mr" ? "नोंदणी वेळ" : "Timestamp"}
              </span>
              <span className="text-slate-600 font-medium block mt-0.5">
                {order?.createdAt}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Itemized Order List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "mr" ? "साहित्य तपशील" : "Order Items"}
              </h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {order?.items.map((it, idx) => {
              const nameMatch = it.name.match(/^(.*?)\s*\((.*?)\)$/);
              const unitMatch = it.unit.match(/^(.*?)\s*\((.*?)\)$/);

              return (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      {nameMatch ? (
                        <BilingualName
                          mr={nameMatch[1]}
                          en={nameMatch[2]}
                          secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                        />
                      ) : (
                        it.name
                      )}
                    </span>
                  </div>
                  <span className="font-extrabold text-brand-primary px-2.5 py-1 rounded-lg bg-emerald-50">
                    {it.quantity}{" "}
                    {unitMatch ? (
                      <BilingualName
                        mr={unitMatch[1]}
                        en={unitMatch[2]}
                        secondaryClassName="text-[10px] font-normal text-slate-500 ml-1"
                      />
                    ) : (
                      it.unit
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
