import { prisma } from "@/lib/prisma";
import { ownerFilter } from "@/lib/permissions";
import { startOfMonth, subMonths, addDays } from "date-fns";
import type { AiUser } from "@/lib/ai/capabilities";

/** Genera alertas proactivas sin que el usuario tenga que preguntar (sección "Proactividad"). */
export async function getProactiveAlerts(user: AiUser) {
  const scope = ownerFilter(user.role, user.id);
  const now = new Date();
  const alerts: string[] = [];

  const staleCount = await prisma.contact.count({
    where: {
      companyId: user.companyId,
      status: { notIn: ["GANADO", "PERDIDO"] },
      OR: [{ lastContactAt: { lt: addDays(now, -3) } }, { lastContactAt: null }],
      ...scope,
    },
  });
  if (staleCount > 0) alerts.push(`⚠️ Tienes ${staleCount} lead(s) sin seguimiento hace más de 3 días.`);

  const expiringQuotes = await prisma.quote.count({
    where: {
      companyId: user.companyId,
      status: { in: ["ENVIADA", "VISTA"] },
      validUntil: { lte: addDays(now, 2), gte: now },
    },
  });
  if (expiringQuotes > 0) alerts.push(`⚠️ ${expiringQuotes} cotización(es) vencen en los próximos 2 días.`);

  const highProbOpen = await prisma.opportunity.count({
    where: { companyId: user.companyId, status: "OPEN", probability: { gte: 75 }, ...scope },
  });
  if (highProbOpen > 0) alerts.push(`🔥 Tienes ${highProbOpen} oportunidad(es) con alta probabilidad de cierre.`);

  const salesWhere = { companyId: user.companyId, status: { not: "CANCELADA" as const }, ...scope };
  const [thisMonth, lastMonth] = await Promise.all([
    prisma.sale.aggregate({ where: { ...salesWhere, saleDate: { gte: startOfMonth(now) } }, _sum: { total: true } }),
    prisma.sale.aggregate({
      where: { ...salesWhere, saleDate: { gte: startOfMonth(subMonths(now, 1)), lt: startOfMonth(now) } },
      _sum: { total: true },
    }),
  ]);
  const cur = thisMonth._sum.total ?? 0;
  const prev = lastMonth._sum.total ?? 0;
  if (prev > 0) {
    const change = ((cur - prev) / prev) * 100;
    if (Math.abs(change) >= 10) {
      alerts.push(
        change > 0
          ? `📈 Las ventas subieron ${change.toFixed(0)}% este mes respecto al anterior.`
          : `⚠️ Las ventas bajaron ${Math.abs(change).toFixed(0)}% este mes respecto al anterior.`
      );
    }
  }

  const overdueTasks = await prisma.task.count({
    where: {
      companyId: user.companyId,
      status: "PENDING",
      dueDate: { lt: now },
      ...(scope.ownerId ? { assignedToId: scope.ownerId } : {}),
    },
  });
  if (overdueTasks > 0) alerts.push(`⚠️ Tienes ${overdueTasks} tarea(s) vencida(s) sin completar.`);

  return alerts;
}
