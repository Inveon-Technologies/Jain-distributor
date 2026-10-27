"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { autoBilingualName, formatBilingual } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import { Salesperson } from "@/data/mockData";
import { Users, Phone, Mail, CheckCircle2, Plus, X, UserPlus, Check, Trash2, Eye, EyeOff, Clock, Pencil } from "lucide-react";

export default function AdminSalespersonsPage() {
  const { language, salespersons, villages, addSalesperson, updateSalesperson, deleteSalesperson, toggleSalespersonStatus } = useApp();
  const t = translations[language];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spToDelete, setSpToDelete] = useState<Salesperson | null>(null);
  const [spToEdit, setSpToEdit] = useState<Salesperson | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [assignedVillage, setAssignedVillage] = useState(villages[0]?.id || "v-1");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAssignedVillage, setEditAssignedVillage] = useState("v-1");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const openEditModal = (sp: Salesperson) => {
    setSpToEdit(sp);
    setEditName(language === "en" ? (sp.nameEn || sp.name) : (sp.name || sp.nameEn));
    setEditEmail(sp.email);
    setEditMobile(sp.mobile);
    setEditPassword(sp.password || "");
    setEditAssignedVillage(sp.assignedVillages?.[0] || villages[0]?.id || "v-1");
    setEditStatus(sp.status);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spToEdit || !editName.trim() || !editEmail.trim()) return;

    const pair = autoBilingualName(editName);

    updateSalesperson(spToEdit.id, {
      name: pair.mr,
      nameEn: pair.en,
      email: editEmail.trim(),
      mobile: editMobile.trim() || spToEdit.mobile,
      ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      assignedVillages: [editAssignedVillage],
      status: editStatus,
    });

    setSpToEdit(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const pair = autoBilingualName(name);

    addSalesperson({
      name: pair.mr,
      nameEn: pair.en,
      email: email.trim(),
      mobile: mobile.trim() || "+91 98000 00000",
      password: password.trim() || "123456",
      assignedVillages: [assignedVillage],
      status,
    });

    setName("");
    setEmail("");
    setMobile("");
    setPassword("123456");
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
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4 flex flex-col justify-between overflow-hidden"
          >
            <div>
              {/* Card Header: Avatar, Name & Action Buttons */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold text-lg shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
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

                {/* Edit & Delete Action Buttons: Fixed at top right inside card */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(sp)}
                    title={t.editSalesperson}
                    className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

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

              {/* Status Toggle Row: Dedicated full-width bar so status changes never push buttons */}
              <div className="mt-3.5 flex items-center justify-between bg-slate-50/80 px-3 py-1.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.status}:
                </span>
                <button
                  type="button"
                  onClick={() => toggleSalespersonStatus(sp.id)}
                  title={sp.status === "ACTIVE" ? t.clickToDeactivate : t.clickToActivate}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                    sp.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  {sp.status === "ACTIVE" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.active}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{language === "mr" ? "मंजुरी प्रलंबित" : "Pending Approval"}</span>
                    </>
                  )}
                </button>
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

            {/* Assigned Route */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {t.assignedVillages}:
              </span>
              <span className="font-bold text-slate-700">
                {sp.assignedVillages.length} {t.villages}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Salesperson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
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
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
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
                  placeholder={language === "mr" ? "उदा. वर्षा पाटील / Varsha Patil / Kedar" : "e.g. Varsha Patil, Kedar"}
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
                  {t.tempPasswordLabel} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.tempPasswordPlaceholder}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {t.tempPasswordHelp}
                </span>
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
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
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

      {/* Edit Salesperson Modal */}
      {spToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {t.editSalesperson}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {t.editModalTitle}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSpToEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.salespersonNameLabel} *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Varsha Patil, Kedar"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === "mr"
                    ? "इंग्रजी किंवा मराठीत नाव टाका, दोन्ही भाषांत आपोआप सेव्ह होईल."
                    : "Type in English or Marathi, will auto-save in both languages."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.salespersonMobileLabel}
                </label>
                <input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  placeholder="+91 98220 00000"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.salespersonEmailLabel} *
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="sales@jain.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.assignVillagesLabel}
                </label>
                <select
                  value={editAssignedVillage}
                  onChange={(e) => setEditAssignedVillage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatBilingual(v.marathiName, v.englishName, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.status}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("ACTIVE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      editStatus === "ACTIVE"
                        ? "bg-emerald-50 border-emerald-500 text-brand-primary"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.active}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("INACTIVE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      editStatus === "INACTIVE"
                        ? "bg-amber-50 border-amber-500 text-amber-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.inactive}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSpToEdit(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveChanges}</span>
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
