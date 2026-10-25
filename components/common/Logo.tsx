"use client";

import React from "react";

export function Logo({ size = "default", light = false }: { size?: "sm" | "default" | "lg"; light?: boolean }) {
  const iconSize = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const titleSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";
  const subSize = size === "sm" ? "text-[8px]" : size === "lg" ? "text-xs" : "text-[9.5px]";

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative ${iconSize} flex-shrink-0 flex items-center justify-center`}>
        <svg className="w-full h-full drop-shadow-sm" fill="none" viewBox="0 0 54 48" xmlns="http://www.w3.org/2000/svg">
          {/* Parcel boxes */}
          <path d="M26 12L38 18V30L26 24V12Z" fill="#E6A838" />
          <path d="M14 18L26 24V36L14 30V18Z" fill="#C57E1E" />
          <path d="M26 24L38 30L26 36L14 30L26 24Z" fill="#DFA02E" />
          {/* Stylized J sweep */}
          <path
            d="M14 6C14 6 22 6 22 18L22 36C22 41 17 42 12 42C7 42 6 38 6 38"
            stroke={light ? "#34d399" : "#084826"}
            strokeLinecap="round"
            strokeWidth="6.5"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight ${titleSize} ${light ? "text-white" : "text-brand-dark"}`}>
          JAIN
        </span>
        <span
          className={`font-bold tracking-[0.22em] uppercase ${subSize} ${
            light ? "text-emerald-200" : "text-brand-primary"
          }`}
        >
          DISTRIBUTOR
        </span>
      </div>
    </div>
  );
}
