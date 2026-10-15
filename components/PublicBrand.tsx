"use client";

import Link from "next/link";
import { GiDeathSkull } from "react-icons/gi";
import { useBranding } from "@/components/providers/BrandingProvider";

export function PublicBrand() {
  const { branding } = useBranding();

  return (
    <Link
      href="/"
      className="text-3xl font-extrabold text-red-500 tracking-wider animate-pulse flex items-center gap-3"
    >
      {branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={branding.systemName}
          className="h-9 w-9 object-contain"
        />
      ) : (
        <GiDeathSkull className="text-3xl" />
      )}
      {branding.systemName}
    </Link>
  );
}
