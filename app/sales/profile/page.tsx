"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { BilingualName } from "@/components/common/BilingualName";
import {
  User,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Award,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function SalesProfilePage() {
  const router = useRouter();
  const { language, currentUser, logout, orders, villages, changePassword } = useApp();
  const t = translations[language];

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword || !currentPassword) {
      setPasswordError(language === "mr" ? "कृपया पासवर्ड टाका" : "Please enter a password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatch);
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.error || "Could not change password");
      return;
    }
    setPasswordSuccess(t.passwordChangedSuccess);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPasswordSuccess("");
    }, 1500);
  };

  const userOrders = orders.filter((o) => o.salespersonId === currentUser?.id);
  const shopsVisitedToday = new Set(userOrders.map((o) => o.shopId)).size;
  const assignedVillages = villages.filter((v) => currentUser?.assignedVillages.includes(v.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card Header */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-deep rounded-3xl p-6 sm:p-8 text-white relative shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border-2 border-emerald-400/30 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            <User className="w-12 h-12 text-emerald-200" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>{t.salesRole}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              <BilingualName
                mr={currentUser?.name || ""}
                en={currentUser?.nameEn || ""}
                secondaryClassName="text-base sm:text-lg font-normal text-emerald-200 ml-2"
              />
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser?.email || ""}</span>
            </p>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium flex items-center justify-center sm:justify-start gap-2">
              <Phone className="w-3.5 h-3.5" />
              <span>{currentUser?.mobile || "+91 98220 12345"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
            {t.totalOrdersToday}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-brand-primary">
            {userOrders.length}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {language === "mr" ? "यशस्वीरीत्या नोंदवल्या" : "Successfully logged"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
            {t.totalVisitsToday}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800">
            {shopsVisitedToday}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {language === "mr" ? "दुकानांना भेटी" : "Stores Visited"}
          </span>
        </div>
      </div>

      {/* Assigned Route Territories */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-primary" />
          <span>{t.assignedVillages}</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {assignedVillages.length === 0 && (
            <span className="text-xs text-slate-400">{language === "mr" ? "अजून गाव नेमलेले नाही" : "No villages assigned yet"}</span>
          )}
          {assignedVillages.map((v) => (
            <span
              key={v.id}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-brand-primary text-xs font-bold flex items-center gap-1"
            >
              <span>📍</span>
              <BilingualName
                mr={v.marathiName}
                en={v.englishName}
                secondaryClassName="text-[11px] font-normal text-slate-500 ml-1"
              />
            </span>
          ))}
        </div>
      </div>

      {/* Account Security & Password */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {language === "mr" ? "खाते सुरक्षा आणि पासवर्ड" : "Account Security & Password"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {language === "mr" ? "तुमचा लॉगिन पासवर्ड अद्यतनित करा" : "Update your field login credentials"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsPasswordModalOpen(true);
            setPasswordError("");
            setPasswordSuccess("");
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <KeyRound className="w-4 h-4 text-brand-primary" />
          <span>{t.changePassword}</span>
        </button>
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>{t.logout}</span>
      </button>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t.changePasswordTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {t.changePasswordSubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {language === "mr" ? "सध्याचा पासवर्ड" : "Current Password"} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.newPasswordLabel} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.confirmPasswordLabel} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
