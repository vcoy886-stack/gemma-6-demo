import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/app/Sidebar";
import { MobileNav } from "@/components/app/MobileNav";
import { UserMenu } from "@/components/app/UserMenu";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import { OnboardingBanner } from "@/components/app/OnboardingBanner";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={user.role} companyName={company?.name ?? "Empresa"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <MobileNav role={user.role} companyName={company?.name ?? "Empresa"} />
            <span className="text-sm font-medium text-foreground md:hidden">
              {company?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <UserMenu name={user.name} role={user.role} />
          </div>
        </header>
        {company && !company.onboardingComplete && <OnboardingBanner />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <AiAssistantPanel />
    </div>
  );
}
