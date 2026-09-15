export const CONTACT_STATUSES = [
  "NUEVO",
  "CONTACTADO",
  "INTERESADO",
  "CALIENTE",
  "COTIZACION_ENVIADA",
  "NEGOCIACION",
  "GANADO",
  "PERDIDO",
  "SEGUIMIENTO",
] as const;

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  INTERESADO: "Interesado",
  CALIENTE: "Caliente",
  COTIZACION_ENVIADA: "Cotización enviada",
  NEGOCIACION: "Negociación",
  GANADO: "Ganado",
  PERDIDO: "Perdido",
  SEGUIMIENTO: "Seguimiento",
};

export const LEAD_SOURCES = [
  "Facebook",
  "Instagram",
  "WhatsApp",
  "Referido",
  "Sitio web",
  "Llamada entrante",
  "Feria/Evento",
  "Importación CSV",
  "Otro",
];

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  CALL: "Llamada",
  EMAIL: "Correo",
  WHATSAPP: "WhatsApp",
  MEETING: "Reunión",
  NOTE: "Nota",
  STATUS_CHANGE: "Cambio de estado",
  SYSTEM: "Sistema",
};

export const SCORE_REASON_OPTIONS = [
  { value: "", label: "Sin efecto en puntuación" },
  { value: "PIDIO_PRECIO", label: "+20 Solicitó precio" },
  { value: "PIDIO_DISPONIBILIDAD", label: "+20 Solicitó disponibilidad" },
  { value: "SOLICITO_COTIZACION", label: "+18 Solicitó cotización" },
  { value: "PREGUNTO_ENTREGA", label: "+15 Preguntó por entrega" },
  { value: "RESPONDIO_SEGUIMIENTO", label: "+15 Respondió al seguimiento" },
  { value: "INTENCION_COMPRA", label: "+12 Indicó intención de compra" },
  { value: "PRODUCTO_ALTO_VALOR", label: "+8 Consultó producto de alto valor" },
  { value: "CLIENTE_RECURRENTE", label: "+15 Tiene historial de compras" },
  { value: "SIN_RESPUESTA_3_DIAS", label: "-10 Sin respuesta hace 3+ días" },
  { value: "SIN_RESPUESTA_7_DIAS", label: "-15 Sin respuesta hace 7+ días" },
];

export function formatCurrency(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

export function contactName(c: { firstName: string; lastName?: string | null }) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}
