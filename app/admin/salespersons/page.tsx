"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import { Salesperson } from "@/data/mockData";
import { Users, Phone, Mail, CheckCircle2, XCircle, Plus, X, UserPlus, Check, Trash2 } from "lucide-react";

export default function AdminSalespersonsPage() {
  const { language, salespersons, villages, addSalesperson, deleteSalesperson } = useApp();
  const t = translations[language];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spToDelete, setSpToDelete] = useState<Salesperson | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [assignedVillage, setAssignedVillage] = useState(villages[0]?.id || "v-1");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addSalesperson({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim() || "+91 98000 00000",
      assignedVillages: [assignedVillage],
      status,
    });

    setName("");
    setEmail("");
    setMobile("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {t.salespersons}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "सर्व फील्ड सेल्समन, त्यांची गावे व दैनिक कामगिरी व्यवस्थापित करा."
              : "Monitor field force performance, active status, and assigned territories."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-white text-brand-primary border border-slate-200 text-xs font-bold shadow-xs">
            {salespersons.length} {t.totalSalespersonsCount}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addSalespersonBtn}</span>
          </button>
        </div>
      </div>

      {/* Salespersons Grid */}
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
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      <BilingualName
                        mr={sp.name}
                        en={sp.nameEn}
                        secondaryClassName="text-xs sm:text-sm font-normal text-slate-500 ml-1.5"
                      />
                    </h3>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5">
                      {t.salesRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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

                  <button
                    type="button"
                    onClick={() => setSpToDelete(sp)}
                    title={t.deleteSalesperson}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                    {t.visitsToday}
                  </span>
                  <span className="text-base font-extrabold text-slate-800">
                    {sp.todayVisits}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block font-medium">
                    {t.todayOrders}
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
                {t.assignedVillages}:
              </span>
              <div className="flex flex-wrap gap-1">
                {sp.assignedVillages.map((vid) => {
                  const v = villages.find((x) => x.id === vid);
                  return (
                    <span
                      key={vid}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-brand-primary font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>📍</span>
                      <BilingualName
                        mr={v?.marathiName}
                        en={v?.englishName}
                        secondaryClassName="text-[10px] font-normal text-slate-500 ml-1"
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Salesperson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t.newSalespersonModalTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {t.newSalespersonModalSubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.salespersonNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.salespersonNamePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.salespersonEmailLabel} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.salespersonEmailPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.salespersonMobileLabel}
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={t.salespersonMobilePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.assignVillagesLabel}
                </label>
                <select
                  value={assignedVillage}
                  onChange={(e) => setAssignedVillage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatBilingual(v.marathiName, v.englishName, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.status}
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "ACTIVE"}
                      onChange={() => setStatus("ACTIVE")}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                    <span>{t.active}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "INACTIVE"}
                      onChange={() => setStatus("INACTIVE")}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                    <span>{t.inactive}</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveSalespersonBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {spToDelete && (
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
                    mr={spToDelete.name}
                    en={spToDelete.nameEn}
                    className="font-bold text-slate-800"
                    secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                  />
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.deleteSalespersonConfirmMsg}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSpToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSalesperson(spToDelete.id);
                  setSpToDelete(null);
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
