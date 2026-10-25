"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { Users, Phone, Mail, CheckCircle2, XCircle } from "lucide-react";

export default function AdminSalespersonsPage() {
  const { language, salespersons, villages } = useApp();
  const t = translations[language];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {language === "mr" ? "सेल्समन व्यवस्थापन" : "Salespersons Management"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "सर्व फील्ड सेल्समन, त्यांची गावे व दैनिक स्थिती व्यवस्थापित करा."
              : "Monitor field force performance, active status, and assigned territories."}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold self-start sm:self-auto">
          {salespersons.length} {language === "mr" ? "एकूण सेल्समन" : "Total Salespersons"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {salespersons.map((sp) => (
          <div
            key={sp.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold text-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {sp.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium block">
                      {sp.nameEn}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    sp.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {sp.status === "ACTIVE" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{t.active}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>{t.inactive}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Contact info */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sp.mobile}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sp.email}</span>
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block font-medium">
                    {language === "mr" ? "आजच्या भेटी" : "Today Visits"}
                  </span>
                  <span className="text-base font-extrabold text-slate-800">
                    {sp.todayVisits}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block font-medium">
                    {language === "mr" ? "ऑर्डर्स" : "Today Orders"}
                  </span>
                  <span className="text-base font-extrabold text-brand-primary">
                    {sp.todayOrders}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Territories */}
            <div className="pt-2 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">
                {language === "mr" ? "नेमलेली गावे" : "Assigned Villages"}:
              </span>
              <div className="flex flex-wrap gap-1">
                {sp.assignedVillages.map((vid) => {
                  const v = villages.find((x) => x.id === vid);
                  return (
                    <span
                      key={vid}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 text-brand-primary font-bold text-[11px]"
                    >
                      {v?.marathiName || vid}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
