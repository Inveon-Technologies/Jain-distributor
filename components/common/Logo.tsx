"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "default" | "lg" | "xl";
  light?: boolean;
  variant?: "full" | "icon";
  className?: string;
}

export function Logo({
  size = "default",
  light = false,
  variant = "full",
  className = "",
}: LogoProps) {
  const isIcon = variant === "icon";

  // Dimensions based on source aspect ratios:
  // Full logo: 874x806 (~1.08:1)
  // Icon only: 864x479 (~1.80:1)
  const dims = {
    sm: isIcon ? { w: 58, h: 32 } : { w: 42, h: 38 },
    default: isIcon ? { w: 80, h: 44 } : { w: 62, h: 56 },
    lg: isIcon ? { w: 120, h: 66 } : { w: 98, h: 88 },
    xl: isIcon ? { w: 160, h: 88 } : { w: 130, h: 120 },
  }[size] || { w: 62, h: 56 };

  const src = isIcon ? "/images/logo-icon.png" : "/images/logo-transparent.png";

  const imageElement = (
    <Image
      src={src}
      alt="Jain Distributor"
      width={dims.w}
      height={dims.h}
      priority
      className="h-auto w-auto object-contain max-h-full"
    />
  );

  if (light) {
    return (
      <div
        className={`inline-flex items-center bg-white px-3.5 py-2 rounded-2xl shadow-md border border-white/30 select-none ${className}`}
      >
        {imageElement}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {imageElement}
    </div>
  );
}
