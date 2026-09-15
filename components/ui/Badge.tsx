import clsx from "clsx";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  primary: "bg-primary-soft text-primary",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-cyan-50 text-cyan-700",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const SCORE_LEVEL_TONE: Record<string, Tone> = {
  FRIO: "info",
  INTERESADO: "primary",
  CALIENTE: "warning",
  MUY_CALIENTE: "danger",
  ALTA_PRIORIDAD: "danger",
};

export function ScoreBadge({ score, level }: { score: number; level: string }) {
  return (
    <Badge tone={SCORE_LEVEL_TONE[level] ?? "neutral"}>
      {score} · {level.replace("_", " ")}
    </Badge>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  NUEVO: "info",
  CONTACTADO: "primary",
  INTERESADO: "primary",
  CALIENTE: "warning",
  COTIZACION_ENVIADA: "warning",
  NEGOCIACION: "warning",
  GANADO: "success",
  PERDIDO: "danger",
  SEGUIMIENTO: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replaceAll("_", " ")}</Badge>;
}
