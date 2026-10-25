"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { Logo } from "@/components/common/Logo";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { Lock, Mail, Users, Store, Mic, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { language, login } = useApp();
  const t = translations[language];

  const [email, setEmail] = useState("amol@jain.com");
  const [password, setPassword] = useState("sales123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        setError(res.error || "Invalid credentials");
      }
    }, 400);
  };

  const fillSalesDemo = () => {
    setEmail("amol@jain.com");
    setPassword("sales123");
  };

  const fillAdminDemo = () => {
    setEmail("admin@jain.com");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f4f7f5] text-slate-800 selection:bg-brand-primary selection:text-white relative">
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
          <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/80 pt-4">
            <span>Client: Jain Distributor, Pandharpur</span>
            <span className="font-semibold">{t.poweredBy}</span>
          </div>
        </section>

        {/* Right Login Card Container */}
        <section className="lg:col-span-5 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 bg-[#f4f7f5] relative">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-9 shadow-[0_20px_50px_rgba(4,35,18,0.06)] border border-slate-100">
            {/* Login Card Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-brand-primary mb-3">
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

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
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
                    placeholder={t.enterEmail}
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.enterPassword}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary text-sm font-medium transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-[0.99] transition"
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

            {/* Quick Demo Testing Switchers (Very handy for testing!) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
                {language === "mr" ? "चाचणीसाठी थेट लॉगिन निवडा" : "Quick Testing Helper"}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={fillSalesDemo}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    email === "amol@jain.com"
                      ? "border-emerald-600 bg-emerald-50/70"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <Users className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 leading-tight">
                      अमोल पाटील
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      सेल्समन (Salesperson)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={fillAdminDemo}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    email === "admin@jain.com"
                      ? "border-emerald-600 bg-emerald-50/70"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 leading-tight">
                      व्यवस्थापक
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      Admin / Back-Office
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {language === "mr"
                    ? "ई-मेल नुसार संबंधित डॅशबोर्ड आपोआप उघडेल."
                    : "Assigned portal routes automatically based on credentials."}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
