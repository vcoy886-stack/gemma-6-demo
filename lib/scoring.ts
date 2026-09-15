import { prisma } from "@/lib/prisma";

/**
 * Catálogo de motivos de puntuación de leads. Los puntos están fijados aquí
 * (no configurables desde la UI en esta versión) y se documentan en el README.
 */
export const SCORE_REASONS = {
  PIDIO_PRECIO: { points: 20, label: "Solicitó precio" },
  PIDIO_DISPONIBILIDAD: { points: 20, label: "Solicitó disponibilidad" },
  PREGUNTO_ENTREGA: { points: 15, label: "Preguntó por entrega" },
  RESPONDIO_SEGUIMIENTO: { points: 15, label: "Respondió al seguimiento" },
  INTENCION_COMPRA: { points: 12, label: "Indicó intención de compra" },
  SOLICITO_COTIZACION: { points: 18, label: "Solicitó cotización" },
  CONVERSACION_REGISTRADA: { points: 6, label: "Nueva conversación registrada" },
  PRODUCTO_ALTO_VALOR: { points: 8, label: "Consultó un producto de alto valor" },
  CLIENTE_RECURRENTE: { points: 15, label: "Tiene historial de compras" },
  SIN_RESPUESTA_3_DIAS: { points: -10, label: "Sin respuesta hace más de 3 días" },
  SIN_RESPUESTA_7_DIAS: { points: -15, label: "Sin respuesta hace más de 7 días" },
  MARCADO_PERDIDO: { points: -25, label: "Oportunidad marcada como perdida" },
  AJUSTE_MANUAL: { points: 0, label: "Ajuste manual" },
} as const;

export type ScoreReasonCode = keyof typeof SCORE_REASONS;

export function levelFromScore(score: number) {
  const s = Math.max(0, Math.min(100, score));
  if (s <= 20) return "FRIO";
  if (s <= 40) return "INTERESADO";
  if (s <= 60) return "CALIENTE";
  if (s <= 80) return "MUY_CALIENTE";
  return "ALTA_PRIORIDAD";
}

export const SCORE_LEVEL_LABELS: Record<string, string> = {
  FRIO: "Frío",
  INTERESADO: "Interesado",
  CALIENTE: "Caliente",
  MUY_CALIENTE: "Muy caliente",
  ALTA_PRIORIDAD: "Alta prioridad",
};

/**
 * Registra un evento de puntuación, actualiza el score acumulado del contacto
 * (acotado a 0-100) y recalcula su nivel. Devuelve el contacto actualizado.
 */
export async function addScoreEvent(
  contactId: string,
  reasonCode: ScoreReasonCode,
  opts?: { userId?: string; customPoints?: number; customLabel?: string }
) {
  const reason = SCORE_REASONS[reasonCode];
  const points = opts?.customPoints ?? reason.points;
  const label = opts?.customLabel ?? reason.label;

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw new Error("Contacto no encontrado");

  const newScore = Math.max(0, Math.min(100, contact.score + points));
  const newLevel = levelFromScore(newScore);

  await prisma.scoreEvent.create({
    data: {
      contactId,
      points,
      reason: label,
      createdById: opts?.userId,
    },
  });

  return prisma.contact.update({
    where: { id: contactId },
    data: { score: newScore, scoreLevel: newLevel },
  });
}

/** Devuelve el desglose de puntuación explicado, más reciente primero. */
export async function getScoreExplanation(contactId: string) {
  const events = await prisma.scoreEvent.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return events;
}
