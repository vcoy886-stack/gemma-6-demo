"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { Role } from "@prisma/client";
import { can } from "@/lib/permissions";
import { NAV_ITEMS } from "@/lib/nav";

export function MobileNav({ role, companyName }: { role: Role; companyName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-muted hover:bg-black/5 md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Sparkles size={16} />
                </div>
                <span className="text-sm font-semibold">{companyName}</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-muted">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-0.5 px-3 py-4">
              {NAV_ITEMS.filter((item) => !item.perm || can(role, item.perm)).map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                      active ? "bg-primary-soft text-primary" : "text-muted hover:bg-black/5"
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
