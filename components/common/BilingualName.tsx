"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { getBilingualParts } from "@/utils/transliterate";

export interface BilingualNameProps {
  mr?: string;
  en?: string;
  lang?: "mr" | "en";
  className?: string;
  secondaryClassName?: string;
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p";
}

export function BilingualName({
  mr,
  en,
  lang,
  className = "",
  secondaryClassName = "text-xs sm:text-sm font-normal text-slate-500 ml-1.5",
  as: Component = "span",
}: BilingualNameProps) {
  const { language: appLang } = useApp();
  const activeLang = lang || appLang;

  const { primary, secondary } = getBilingualParts(mr, en, activeLang);

  if (!primary) return null;

  return (
    <Component className={className}>
      <span>{primary}</span>
      {secondary && (
        <span className={secondaryClassName}>
          ({secondary})
        </span>
      )}
    </Component>
  );
}

export default BilingualName;
