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
    lg: isIcon ? { w: 105, h: 58 } : { w: 80, h: 74 },
    xl: isIcon ? { w: 140, h: 78 } : { w: 110, h: 102 },
  }[size] || { w: 62, h: 56 };

  // When light=true (e.g. for dark green hero backgrounds), use transparent white & gold version
  const src = isIcon
    ? "/images/logo-icon.png"
    : light
    ? "/images/logo-white-gold.png"
    : "/images/logo-transparent.png";

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

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {imageElement}
    </div>
  );
}
