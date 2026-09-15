import { prisma } from "@/lib/prisma";
import { ownerFilter } from "@/lib/permissions";
import type { AiUser } from "@/lib/ai/capabilities";
import {
  dailyBriefing,
  formatDailyBriefing,
  getHotLeads,
  formatHotLeads,
  getPendingFollowups,
  formatPendingFollowups,
  getSalesSummary,
  formatSalesSummary,
  getStaleLeads,
  formatStaleLeads,
  getContactSummary,
  formatContactSummary,
} from "@/lib/ai/capabilities";
import { matchHelpTopic, formatHelpTopic } from "@/lib/ai/help";

export type RouteResult = {
  factsText: string;
  isHelp: boolean;
  skipRefinement?: boolean;
};

async function findMentionedContact(user: AiUser, question: string) {
  const scope = ownerFilter(user.role, user.id);
  // Extrae palabras con mayúscula inicial (probables nombres propios) para buscar.
  const candidates = question.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}/g) ?? [];
  const stopwords = new Set(["Resume", "Genera", "Muéstrame", "Cuáles", "Qué", "Cómo"]);
  const names = candidates.filter((c) => !stopwords.has(c));
  if (names.length === 0) return null;

  for (const name of names) {
    const contact = await prisma.contact.findFirst({
      where: { companyId: user.companyId, firstName: { contains: name }, ...scope },
    });
    if (contact) return contact;
  }
  return null;
}

export async function routeQuestion(user: AiUser, question: string): Promise<RouteResult> {
  const q = question.toLowerCase();

  const looksLikeHowTo = /c[oó]mo|pasos para|instrucciones|manual de/.test(q);
  if (looksLikeHowTo) {
    const helpTopic = matchHelpTopic(q);
    if (helpTopic) {
      return { factsText: formatHelpTopic(helpTopic), isHelp: true, skipRefinement: true };
    }
  }

  if (/resum|objeci[oó]n|mensaje (sugerido|para)|genera(r)? un mensaje/.test(q)) {
    const contact = await findMentionedContact(user, question);
    if (contact) {
      const summary = await getContactSummary(user, contact.id);
      const base = formatContactSummary(summary);
      if (/mensaje/.test(q)) {
        const suggestion = `Mensaje sugerido para WhatsApp:\n"Hola ${contact.firstName}, soy ${user.name} de nuestro equipo. Quería darte seguimiento respecto a tu interés reciente. ¿Tienes unos minutos esta semana para conversar los detalles?"`;
        return { factsText: `${base}\n\n${suggestion}`, isHelp: false };
      }
      return { factsText: base, isHelp: false };
    }
    return {
      factsText: "No identifiqué a qué cliente te refieres. Menciona su nombre tal como aparece en el CRM.",
      isHelp: false,
      skipRefinement: true,
    };
  }

  if (/hoy|qu[eé] debo hacer|prioridad/.test(q)) {
    const data = await dailyBriefing(user);
    return { factsText: formatDailyBriefing(data), isHelp: false };
  }

  if (/caliente|prioridad alta|mejores leads/.test(q)) {
    const leads = await getHotLeads(user);
    return { factsText: formatHotLeads(leads), isHelp: false };
  }

  if (/perdiendo|riesgo|sin seguimiento|sin respuesta/.test(q)) {
    const leads = await getStaleLeads(user);
    return { factsText: formatStaleLeads(leads), isHelp: false };
  }

  if (/seguimiento(s)? pendiente|tareas pendientes|qu[eé] tareas/.test(q)) {
    const tasks = await getPendingFollowups(user);
    return { factsText: formatPendingFollowups(tasks), isHelp: false };
  }

  if (/venta|producto m[aá]s vendido|bajando|subiendo|an[aá]liza/.test(q)) {
    const summary = await getSalesSummary(user);
    return { factsText: formatSalesSummary(summary), isHelp: false };
  }

  // Fallback: resumen general del día como punto de partida útil.
  const data = await dailyBriefing(user);
  return { factsText: formatDailyBriefing(data), isHelp: false };
}
