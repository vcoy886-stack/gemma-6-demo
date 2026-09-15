"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Sparkles } from "lucide-react";
import type { Role } from "@prisma/client";
import { can } from "@/lib/permissions";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar({ role, companyName }: { role: Role; companyName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{companyName}</p>
          <p className="text-[11px] text-muted">VentasIA</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.filter((item) => !item.perm || can(role, item.perm)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-black/[0.03] hover:text-foreground"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
