"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useApp();

  return (
    <div
      className={`inline-flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-full text-xs font-semibold border border-slate-200/80 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("mr")}
        className={`px-3 py-1 rounded-full transition-all duration-200 ${
          language === "mr"
            ? "bg-brand-primary text-white shadow-sm font-bold"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        मराठी
      </button>
      <span className="text-slate-300 px-1 select-none">|</span>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-full transition-all duration-200 ${
          language === "en"
            ? "bg-brand-primary text-white shadow-sm font-bold"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        English
      </button>
    </div>
  );
}
