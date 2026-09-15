"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Rocket } from "lucide-react";

export function OnboardingBanner() {
  const pathname = usePathname();
  if (pathname.startsWith("/onboarding")) return null;

  return (
    <Link
      href="/onboarding"
      className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-800 hover:bg-amber-100"
    >
      <span className="flex items-center gap-2">
        <Rocket size={15} />
        Tu configuración inicial no está completa. Termínala para aprovechar todo el sistema.
      </span>
      <span className="whitespace-nowrap font-medium underline">Continuar configuración →</span>
    </Link>
  );
}
