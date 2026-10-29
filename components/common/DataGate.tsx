"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

/**
 * Renders children only when the data they need exists. While the first load runs it shows a
 * loading line; afterwards an empty-state message with an optional link.
 */
export function DataGate({
  ready,
  emptyMr,
  emptyEn,
  href,
  linkMr,
  linkEn,
  children,
}: {
  ready: boolean;
  emptyMr: string;
  emptyEn: string;
  href?: string;
  linkMr?: string;
  linkEn?: string;
  children: React.ReactNode;
}) {
  const { language, loading } = useApp();
  if (ready) return <>{children}</>;
  if (loading) {
    return <div className="p-8 text-center text-slate-400">{language === "mr" ? "लोड होत आहे..." : "Loading..."}</div>;
  }
  return (
    <div className="max-w-md mx-auto p-8 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80">
      <p className="text-sm font-semibold text-slate-600">{language === "mr" ? emptyMr : emptyEn}</p>
      {href && (
        <Link
          href={href}
          className="inline-block px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-deep transition"
        >
          {language === "mr" ? linkMr : linkEn}
        </Link>
      )}
    </div>
  );
}
