"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Summary = {
  companyInfoComplete: boolean;
  productsCount: number;
  contactsCount: number;
  usersCount: number;
  stagesCount: number;
  automationsCount: number;
  whatsappConfigured: boolean;
  onboardingStep: number;
  onboardingComplete: boolean;
};

const STEPS = [
  {
    key: "company",
    title: "Datos de tu empresa",
    description: "Completa nombre, dirección, teléfono y moneda. Aparecerán en tus cotizaciones.",
    href: "/settings",
    check: (s: Summary) => s.companyInfoComplete,
  },
  {
    key: "products",
    title: "Crea tus productos o servicios",
    description: "Necesitas al menos un producto para poder cotizar y vender.",
    href: "/products",
    check: (s: Summary) => s.productsCount > 0,
  },
  {
    key: "contacts",
    title: "Agrega tus primeros clientes",
    description: "Crea contactos manualmente o impórtalos desde un CSV.",
    href: "/crm",
    check: (s: Summary) => s.contactsCount > 0,
  },
  {
    key: "users",
    title: "Invita a tu equipo",
    description: "Agrega vendedores y asigna roles (Administrador, Gerente, Vendedor, Asistente).",
    href: "/settings/users",
    check: (s: Summary) => s.usersCount > 1,
  },
  {
    key: "pipeline",
    title: "Revisa tu pipeline de ventas",
    description: "Ya creamos 9 etapas por defecto. Puedes verlas y empezar a mover oportunidades.",
    href: "/pipeline",
    check: (s: Summary) => s.stagesCount > 0,
  },
  {
    key: "payments",
    title: "Confirma moneda e impuestos",
    description: "Define la moneda y el impuesto por defecto de tus ventas y cotizaciones.",
    href: "/settings",
    check: (s: Summary) => s.companyInfoComplete,
  },
  {
    key: "automations",
    title: "Configura una automatización",
    description: "Por ejemplo: crear una tarea automáticamente cuando entra un lead nuevo.",
    href: "/automations",
    check: (s: Summary) => s.automationsCount > 0,
  },
  {
    key: "integrations",
    title: "Prepara integraciones",
    description: "Configura WhatsApp Business y, si quieres respuestas generativas, tu clave de Anthropic.",
    href: "/whatsapp",
    check: (s: Summary) => s.whatsappConfigured,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch("/api/onboarding/summary")
      .then((r) => r.json())
      .then((s) => {
        setSummary(s);
        setStep(Math.min(s.onboardingStep, STEPS.length - 1));
      });
  }, []);

  async function goTo(next: number) {
    setStep(next);
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: next }),
    });
  }

  async function finish() {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: STEPS.length, complete: true }),
    });
    toast.success("¡Tu sistema está listo!");
    router.push("/dashboard");
  }

  if (!summary) return <div className="p-6 text-sm text-muted">Cargando...</div>;

  const completedCount = STEPS.filter((s) => s.check(summary)).length;
  const percent = Math.round((completedCount / STEPS.length) * 100);
  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Configuración guiada</h1>
        <p className="text-sm text-muted">Prepara tu sistema en 8 pasos. Puedes salir y volver cuando quieras.</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/5">
          <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">{percent}% completado</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-1">
          {STEPS.map((s, i) => {
            const done = s.check(summary);
            return (
              <button
                key={s.key}
                onClick={() => goTo(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  i === step ? "bg-primary-soft text-primary" : "text-muted hover:bg-black/[0.03]"
                }`}
              >
                {done ? <CheckCircle2 size={15} className="text-success" /> : <Circle size={15} />}
                {s.title}
              </button>
            );
          })}
        </div>

        <Card className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-muted">
            Paso {step + 1} de {STEPS.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{current.title}</h2>
          <p className="mt-1 text-sm text-muted">{current.description}</p>

          <div className="mt-4 flex items-center gap-2">
            {current.check(summary) ? (
              <span className="flex items-center gap-1 text-sm text-success">
                <CheckCircle2 size={15} /> Completado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted">
                <Circle size={15} /> Pendiente
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={current.href}>
              <Button variant="outline">Ir a configurar</Button>
            </Link>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => goTo(step + 1)}>Siguiente paso</Button>
            ) : (
              <Button onClick={finish}>
                <PartyPopper size={15} /> Finalizar configuración
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
