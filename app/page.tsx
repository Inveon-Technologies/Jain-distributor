"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { autoBilingualName, formatBilingual } from "@/utils/transliterate";
import { Logo } from "@/components/common/Logo";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import {
  Lock,
  Mail,
  Users,
  Store,
  Mic,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Phone,
  User,
  X,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { language, login, registerSalesperson, villages } = useApp();
  const t = translations[language];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sign up modal for new salespersons
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newVillage, setNewVillage] = useState(villages[0]?.id || "v-1");
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState("");

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRegistrationSuccessMsg("");
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (res.success) {
        if (res.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/sales/home");
        }
      } else {
        if (res.error === "ACCOUNT_INACTIVE") {
          setError(t.accountPendingApproval);
        } else {
          setError(language === "mr" ? "ई-मेल किंवा पासवर्ड चुकीचा आहे." : "Invalid email or password.");
        }
      }
    }, 400);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Simulate instant Google OAuth for active salesperson Amol Patil
    setTimeout(() => {
      login("amol@jain.com", "google-auth");
      router.push("/sales/home");
    }, 500);
  };

  const handleSalespersonSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const pair = autoBilingualName(newName);

    registerSalesperson({
      name: pair.mr,
      nameEn: pair.en,
      email: newEmail.trim(),
      mobile: newMobile.trim(),
      password: newPassword.trim() || "123456",
    });

    setIsSignUpOpen(false);
    setRegistrationSuccessMsg(t.registrationSuccessPending);
    setNewName("");
    setNewEmail("");
    setNewMobile("");
    setNewPassword("");
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetInput.trim()) return;
    setResetSuccess(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between text-slate-800 selection:bg-brand-primary selection:text-white relative">
      {/* Top Language Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
        <LanguageToggle />
      </div>

      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Hero Brand Banner */}
        <section className="lg:col-span-7 bg-gradient-to-br from-[#022312] via-[#053b1f] to-[#032b17] text-white relative flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden">
          {/* Subtle background SVG waves */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-100 450 C 150 420, 280 490, 520 440 C 760 390, 890 470, 1150 430 L 1150 850 L -100 850 Z" fill="#10b981" fillOpacity="0.3" />
              <path d="M-50 330 C 140 370, 240 470, 480 430 C 720 390, 850 480, 1100 420" stroke="#f59e0b" strokeWidth="4" />
            </svg>
          </div>

          {/* Top Logo */}
          <div className="relative z-10">
            <Logo size="lg" light />
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              {t.pandharpur} • Solapur District
            </span>
          </div>

          {/* Center Pitch */}
          <div className="relative z-10 max-w-xl my-8 sm:my-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {t.brandName}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-2">
              {t.brandSubtitle}
            </p>
            <div className="w-16 h-1 bg-amber-400 rounded-full mt-3"></div>
            <p className="text-emerald-100/90 text-sm sm:text-base mt-4 leading-relaxed">
              {language === "mr"
                ? "ग्रामीण भागातील किराणा दुकानांच्या ऑर्डर्स मराठी व्हॉईस रेकॉर्डिंगद्वारे त्वरित नोंदवा आणि व्यवस्थापित करा."
                : "Digitize field sales operations with voice-based Marathi speech-to-text input and real-time management visibility."}
            </p>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 pt-6 border-t border-emerald-900/60">
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 border border-emerald-500/20 backdrop-blur-sm">
                <Users className="w-6 h-6 text-emerald-300 mb-2" />
                <span className="text-xs font-bold text-white">
                  {language === "mr" ? "सेल्स टीम" : "Sales Team"}
                </span>
                <span className="text-[10px] text-emerald-200/80">
                  {language === "mr" ? "थेट नियंत्रण" : "Field Force"}
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 border border-emerald-500/20 backdrop-blur-sm">
                <Store className="w-6 h-6 text-amber-300 mb-2" />
                <span className="text-xs font-bold text-white">
                  {language === "mr" ? "दुकान व गावे" : "Shops & Villages"}
                </span>
                <span className="text-[10px] text-emerald-200/80">
                  {language === "mr" ? "संपूर्ण नेटवर्क" : "Route Coverage"}
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 border border-emerald-500/20 backdrop-blur-sm">
                <Mic className="w-6 h-6 text-emerald-300 mb-2" />
                <span className="text-xs font-bold text-white">
                  {language === "mr" ? "मराठी व्हॉईस" : "Voice Orders"}
                </span>
                <span className="text-[10px] text-emerald-200/80">
                  {language === "mr" ? "शून्य टायपिंग" : "Zero Typing"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200/90 pt-4 border-t border-white/10">
            <span>{language === "mr" ? "ग्राहक: जैन डिस्ट्रीब्युटर, पंढरपूर" : "Client: Jain Distributor, Pandharpur"}</span>
            <div className="flex items-center gap-2">
              <span>{t.poweredBy}</span>
              <img
                src="/images/inveon-logo.jpeg"
                alt="Inveon Technologies"
                className="h-5 w-auto object-contain rounded bg-white p-0.5"
              />
            </div>
          </div>
        </section>

        {/* Right Login Card Container */}
        <section className="lg:col-span-5 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 relative">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-9 shadow-[0_20px_50px_rgba(4,35,18,0.08)] border border-slate-200/80">
            {/* Login Card Header */}
            <div className="mb-6 text-center">
              <div className="lg:hidden flex justify-center mb-4">
                <Logo size="default" />
              </div>
              <div className="hidden lg:inline-flex p-3 rounded-2xl bg-emerald-50 text-brand-primary mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {language === "mr" ? "खात्यात प्रवेश करा" : "Sign in to your account"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {language === "mr"
                  ? "तुमचे अधिकृत ई-मेल व पासवर्ड वापरून लॉगिन करा."
                  : "Enter your assigned credentials to access your portal."}
              </p>
            </div>

            {/* Registration Success Banner */}
            {registrationSuccessMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span>{registrationSuccessMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@jaindistributor.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary text-sm font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary text-sm font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Forgot Password Link */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(true);
                      setResetSuccess(false);
                      setResetInput("");
                    }}
                    className="text-xs font-semibold text-brand-primary hover:text-brand-deep hover:underline cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-[0.99] transition cursor-pointer"
              >
                {isLoading ? (
                  <span>{t.loading}</span>
                ) : (
                  <>
                    <span>{t.login}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                  {language === "mr" ? "किंवा" : "Or continue with"}
                </span>
              </div>
            </div>

            {/* Sign in with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:border-slate-300 transition active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{language === "mr" ? "Google द्वारे साइन इन करा" : "Sign in with Google"}</span>
            </button>

            {/* Sign Up for New Salespersons */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
              <span>{language === "mr" ? "नवीन सेल्समन आहात का? " : "New field salesperson? "}</span>
              <button
                type="button"
                onClick={() => setIsSignUpOpen(true)}
                className="font-bold text-brand-primary hover:underline hover:text-brand-deep cursor-pointer"
              >
                {language === "mr" ? "येथे नोंदणी करा" : "Register here"}
              </button>
            </div>
          </div>

          {/* Dedicated Inveon Technologies Branding with Logo */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">
              {t.poweredBy}
            </span>
            <img
              src="/images/inveon-logo.jpeg"
              alt="Inveon Technologies"
              className="h-6 w-auto object-contain rounded"
            />
          </div>
        </section>
      </main>

      {/* New Salesperson Sign Up Modal */}
      {isSignUpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === "mr" ? "नवीन सेल्समन नोंदणी" : "Salesperson Registration"}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {language === "mr" ? "फील्ड सेल्समन खाते तयार करा" : "Create your field representative profile"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSignUpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalespersonSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.fullNameLabel} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={language === "mr" ? "उदा. वर्षा पाटील / Varsha Patil" : "e.g. Varsha Patil"}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>


              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.email} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nilesh@jain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.mobileLabel} *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.password} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
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
                  {language === "mr" ? "नेमलेले प्राथमिक गाव" : "Primary Village Territory"}
                </label>
                <select
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatBilingual(v.marathiName, v.englishName, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 font-medium">
                ℹ️ {t.registrationSuccessPending}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignUpOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === "mr" ? "नोंदणी विनंती पाठवा" : "Submit Registration"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t.forgotPasswordModalTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {t.forgotPasswordModalSubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                    <span>{language === "mr" ? "विनंती पाठवली!" : "Request Sent!"}</span>
                  </div>
                  <p>{t.resetSentMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-bold text-xs cursor-pointer"
                >
                  {language === "mr" ? "समजले (लॉगिनकडे जा)" : "Got it (Back to Login)"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === "mr" ? "नोंदणीकृत ई-मेल / मोबाईल" : "Registered Email or Mobile"} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={resetInput}
                      onChange={(e) => setResetInput(e.target.value)}
                      placeholder="user@jaindistributor.in / 98220..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.sendResetLink}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
