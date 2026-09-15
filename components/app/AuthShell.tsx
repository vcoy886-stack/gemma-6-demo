import { Sparkles } from "lucide-react";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles size={22} />
          VentasIA
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            Tu gerente comercial virtual, disponible 24/7.
          </h1>
          <p className="mt-4 max-w-md text-indigo-100">
            CRM, pipeline de ventas, cotizaciones y un copiloto de inteligencia artificial
            que te ayuda a no perder ninguna oportunidad de venta.
          </p>
        </div>
        <p className="text-xs text-indigo-200">
          Sistema real con base de datos persistente — no es una maqueta.
        </p>
      </div>
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
