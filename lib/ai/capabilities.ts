import { prisma } from "@/lib/prisma";
import { ownerFilter } from "@/lib/permissions";
import { formatCurrency, formatDate, contactName } from "@/lib/constants";
import { SCORE_LEVEL_LABELS } from "@/lib/scoring";
import type { Role } from "@prisma/client";
import { startOfDay, startOfMonth, subMonths, startOfMonth as som, addDays, subDays } from "date-fns";

export type AiUser = { id: string; role: Role; companyId: string; name: string };

/** ¿Qué debo hacer hoy? — combina seguimientos, leads calientes y cierres próximos. */
export async function dailyBriefing(user: AiUser) {
  const scope = ownerFilter(user.role, user.id);
  const now = new Date();

  const [overdueTasks, todayTasks, hotLeads, closingSoon, quotesExpiring] = await Promise.all([
    prisma.task.findMany({
      where: {
        companyId: user.companyId,
        status: "PENDING",
        dueDate: { lt: startOfDay(now) },
        ...(scope.ownerId ? { assignedToId: scope.ownerId } : {}),
      },
      include: { contact: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        companyId: user.companyId,
        status: "PENDING",
        dueDate: { gte: startOfDay(now), lt: addDays(startOfDay(now), 1) },
        ...(scope.ownerId ? { assignedToId: scope.ownerId } : {}),
      },
      include: { contact: true },
      orderBy: { priority: "desc" },
      take: 5,
    }),
    prisma.contact.findMany({
      where: {
        companyId: user.companyId,
        scoreLevel: { in: ["CALIENTE", "MUY_CALIENTE", "ALTA_PRIORIDAD"] },
        status: { notIn: ["GANADO", "PERDIDO"] },
        ...scope,
      },
      orderBy: { score: "desc" },
      take: 5,
    }),
    prisma.opportunity.findMany({
      where: {
        companyId: user.companyId,
        status: "OPEN",
        expectedCloseDate: { lte: addDays(now, 7), gte: now },
        ...scope,
      },
      include: { contact: true },
      orderBy: { expectedCloseDate: "asc" },
      take: 5,
    }),
    prisma.quote.findMany({
      where: {
        companyId: user.companyId,
        status: { in: ["ENVIADA", "VISTA"] },
        validUntil: { lte: addDays(now, 3), gte: now },
      },
      include: { contact: true },
      take: 5,
    }),
  ]);

  return { overdueTasks, todayTasks, hotLeads, closingSoon, quotesExpiring };
}

export function formatDailyBriefing(data: Awaited<ReturnType<typeof dailyBriefing>>) {
  const lines: string[] = [];
  const pendingCount = data.overdueTasks.length + data.todayTasks.length;

  if (pendingCount === 0 && data.hotLeads.length === 0 && data.closingSoon.length === 0) {
    return "Hoy no tienes tareas pendientes ni alertas importantes. Buen momento para prospectar nuevos leads.";
  }

  lines.push(`Hoy tienes ${pendingCount} seguimiento(s) pendiente(s).`);

  if (data.overdueTasks.length > 0) {
    lines.push("\n⚠️ Vencidas:");
    data.overdueTasks.forEach((t) => lines.push(`- ${t.title}${t.contact ? ` (${contactName(t.contact)})` : ""}`));
  }
  if (data.todayTasks.length > 0) {
    lines.push("\nPara hoy:");
    data.todayTasks.forEach((t) => lines.push(`- ${t.title}${t.contact ? ` (${contactName(t.contact)})` : ""}`));
  }
  if (data.hotLeads.length > 0) {
    lines.push("\n🔥 Leads calientes que deberías contactar primero:");
    data.hotLeads.forEach((c, i) =>
      lines.push(`${i + 1}. ${contactName(c)} — puntuación ${c.score} (${SCORE_LEVEL_LABELS[c.scoreLevel]})`)
    );
  }
  if (data.closingSoon.length > 0) {
    lines.push("\n📈 Oportunidades cerca de cerrarse (próximos 7 días):");
    data.closingSoon.forEach((o) =>
      lines.push(`- ${o.title} (${contactName(o.contact)}) — ${formatCurrency(o.value)}, cierre estimado ${formatDate(o.expectedCloseDate)}`)
    );
  }
  if (data.quotesExpiring.length > 0) {
    lines.push("\n⚠️ Cotizaciones por vencer:");
    data.quotesExpiring.forEach((q) => lines.push(`- ${q.number} (${contactName(q.contact)}) vence ${formatDate(q.validUntil)}`));
  }

  return lines.join("\n");
}

export async function getHotLeads(user: AiUser, limit = 8) {
  const scope = ownerFilter(user.role, user.id);
  return prisma.contact.findMany({
    where: { companyId: user.companyId, status: { notIn: ["GANADO", "PERDIDO"] }, ...scope },
    orderBy: { score: "desc" },
    take: limit,
    include: { scoreEvents: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
}

export function formatHotLeads(leads: Awaited<ReturnType<typeof getHotLeads>>) {
  if (leads.length === 0) return "No tienes leads activos registrados todavía.";
  const lines = leads.map((c, i) => {
    const reasons = c.scoreEvents.map((e) => `${e.points >= 0 ? "+" : ""}${e.points} ${e.reason}`).join(", ");
    return `${i + 1}. ${contactName(c)} — ${c.score} pts (${SCORE_LEVEL_LABELS[c.scoreLevel]})${
      reasons ? `. Motivos: ${reasons}` : ""
    }`;
  });
  return `Tus leads más calientes:\n${lines.join("\n")}`;
}

export async function getPendingFollowups(user: AiUser) {
  const scope = ownerFilter(user.role, user.id);
  return prisma.task.findMany({
    where: {
      companyId: user.companyId,
      status: "PENDING",
      ...(scope.ownerId ? { assignedToId: scope.ownerId } : {}),
    },
    include: { contact: true },
    orderBy: { dueDate: "asc" },
    take: 15,
  });
}

export function formatPendingFollowups(tasks: Awaited<ReturnType<typeof getPendingFollowups>>) {
  if (tasks.length === 0) return "No tienes seguimientos pendientes. ¡Vas al día!";
  const lines = tasks.map(
    (t) => `- ${t.title}${t.contact ? ` (${contactName(t.contact)})` : ""} — vence ${formatDate(t.dueDate)}`
  );
  return `Seguimientos pendientes:\n${lines.join("\n")}`;
}

export async function getSalesSummary(user: AiUser) {
  const scope = ownerFilter(user.role, user.id);
  const now = new Date();
  const where = { companyId: user.companyId, status: { not: "CANCELADA" as const }, ...scope };

  const [thisMonth, lastMonth, topProduct] = await Promise.all([
    prisma.sale.aggregate({ where: { ...where, saleDate: { gte: startOfMonth(now) } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({
      where: { ...where, saleDate: { gte: som(subMonths(now, 1)), lt: som(now) } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: where },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 1,
    }),
  ]);

  let topProductName: string | null = null;
  if (topProduct[0]) {
    const p = await prisma.product.findUnique({ where: { id: topProduct[0].productId } });
    topProductName = p?.name ?? null;
  }

  return {
    thisMonthTotal: thisMonth._sum.total ?? 0,
    thisMonthCount: thisMonth._count,
    lastMonthTotal: lastMonth._sum.total ?? 0,
    lastMonthCount: lastMonth._count,
    topProductName,
    topProductQuantity: topProduct[0]?._sum.quantity ?? 0,
  };
}

export function formatSalesSummary(s: Awaited<ReturnType<typeof getSalesSummary>>) {
  const change = s.lastMonthTotal > 0 ? (((s.thisMonthTotal - s.lastMonthTotal) / s.lastMonthTotal) * 100).toFixed(0) : null;
  const lines = [
    `Ventas de este mes: ${formatCurrency(s.thisMonthTotal)} (${s.thisMonthCount} ventas).`,
    `Ventas del mes anterior: ${formatCurrency(s.lastMonthTotal)} (${s.lastMonthCount} ventas).`,
  ];
  if (change !== null) {
    lines.push(
      Number(change) >= 0
        ? `📈 Las ventas subieron ${change}% respecto al mes anterior.`
        : `⚠️ Las ventas bajaron ${Math.abs(Number(change))}% respecto al mes anterior.`
    );
  }
  if (s.topProductName) {
    lines.push(`Tu producto más vendido este período es "${s.topProductName}" (${s.topProductQuantity} unidades).`);
  }
  return lines.join("\n");
}

export async function getStaleLeads(user: AiUser, days = 3) {
  const scope = ownerFilter(user.role, user.id);
  const threshold = subDays(new Date(), days);
  return prisma.contact.findMany({
    where: {
      companyId: user.companyId,
      status: { notIn: ["GANADO", "PERDIDO"] },
      OR: [{ lastContactAt: { lt: threshold } }, { lastContactAt: null }],
      ...scope,
    },
    orderBy: { score: "desc" },
    take: 10,
  });
}

export function formatStaleLeads(leads: Awaited<ReturnType<typeof getStaleLeads>>) {
  if (leads.length === 0) return "No tienes leads sin seguimiento en riesgo. Buen trabajo manteniendo el contacto.";
  const lines = leads.map(
    (c) => `- ${contactName(c)} (${SCORE_LEVEL_LABELS[c.scoreLevel]}, ${c.score} pts) — último contacto: ${formatDate(c.lastContactAt)}`
  );
  return `⚠️ Estos leads llevan tiempo sin seguimiento y podrías estar perdiéndolos:\n${lines.join("\n")}`;
}

export async function getContactSummary(user: AiUser, contactId: string) {
  const scope = ownerFilter(user.role, user.id);
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, companyId: user.companyId, ...scope },
    include: {
      scoreEvents: { orderBy: { createdAt: "desc" }, take: 5 },
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      opportunities: { include: { stage: true, product: true }, orderBy: { createdAt: "desc" }, take: 3 },
      conversations: { include: { messages: { orderBy: { createdAt: "desc" }, take: 5 } }, orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
  return contact;
}

export function formatContactSummary(contact: Awaited<ReturnType<typeof getContactSummary>>) {
  if (!contact) return "No encontré ese contacto o no tienes acceso a él.";
  const lines = [
    `${contactName(contact)} — ${SCORE_LEVEL_LABELS[contact.scoreLevel]} (${contact.score} pts), estado: ${contact.status}.`,
  ];
  if (contact.opportunities[0]) {
    lines.push(`Oportunidad activa: ${contact.opportunities[0].title} en etapa "${contact.opportunities[0].stage.name}".`);
  }
  if (contact.scoreEvents.length > 0) {
    lines.push(`Motivos recientes de puntuación: ${contact.scoreEvents.map((e) => e.reason).join(", ")}.`);
  }
  const lastMsg = contact.conversations[0]?.messages[0];
  if (lastMsg) {
    lines.push(`Último mensaje (${lastMsg.direction === "IN" ? "del cliente" : "enviado"}): "${lastMsg.content}"`);
  }
  lines.push(
    contact.status === "PERDIDO"
      ? "Recomendación: este lead se marcó como perdido. Considera un seguimiento de reactivación en unas semanas."
      : "Recomendación: prioriza el siguiente contacto según los motivos de puntuación más recientes."
  );
  return lines.join("\n");
}
