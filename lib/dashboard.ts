import {
  startOfDay,
  startOfMonth,
  startOfYear,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";

export type DashboardFilters = {
  companyId: string;
  range: "day" | "week" | "month" | "year";
  ownerId?: string | null;
  productId?: string | null;
  status?: string | null;
};

export async function getDashboardMetrics(filters: DashboardFilters) {
  const { companyId, range, ownerId, productId, status } = filters;
  const now = new Date();

  const saleWhereBase = {
    companyId,
    status: { not: "CANCELADA" as const },
    ...(ownerId ? { ownerId } : {}),
    ...(productId ? { items: { some: { productId } } } : {}),
  };

  const [salesToday, salesMonth, salesYear] = await Promise.all([
    sumSales({ ...saleWhereBase, saleDate: { gte: startOfDay(now) } }),
    sumSales({ ...saleWhereBase, saleDate: { gte: startOfMonth(now) } }),
    sumSales({ ...saleWhereBase, saleDate: { gte: startOfYear(now) } }),
  ]);

  const contactWhere = {
    companyId,
    ...(ownerId ? { ownerId } : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [leadsTotal, leadsNew, leadsHot, newCustomersMonth] = await Promise.all([
    prisma.contact.count({ where: contactWhere }),
    prisma.contact.count({ where: { ...contactWhere, status: "NUEVO" } }),
    prisma.contact.count({
      where: { ...contactWhere, scoreLevel: { in: ["CALIENTE", "MUY_CALIENTE", "ALTA_PRIORIDAD"] } },
    }),
    prisma.contact.count({
      where: { ...contactWhere, status: "GANADO", updatedAt: { gte: startOfMonth(now) } },
    }),
  ]);

  const oppWhere = {
    companyId,
    ...(ownerId ? { ownerId } : {}),
    ...(productId ? { productId } : {}),
  };

  const [opportunitiesOpen, opportunitiesWon, opportunitiesLost, pipelineAgg] = await Promise.all([
    prisma.opportunity.count({ where: { ...oppWhere, status: "OPEN" } }),
    prisma.opportunity.count({ where: { ...oppWhere, status: "WON" } }),
    prisma.opportunity.count({ where: { ...oppWhere, status: "LOST" } }),
    prisma.opportunity.aggregate({ where: { ...oppWhere, status: "OPEN" }, _sum: { value: true } }),
  ]);

  const closedOpps = opportunitiesWon + opportunitiesLost;
  const conversionRate = closedOpps > 0 ? Math.round((opportunitiesWon / closedOpps) * 100) : 0;

  const salesAgg = await prisma.sale.aggregate({
    where: saleWhereBase,
    _avg: { total: true },
    _count: true,
  });

  const pendingFollowups = await prisma.task.count({
    where: { companyId, status: "PENDING", ...(ownerId ? { assignedToId: ownerId } : {}) },
  });

  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { sale: saleWhereBase },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });
  const productIds = topProductsRaw.map((p) => p.productId);
  const productNames = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productNameMap = new Map(productNames.map((p) => [p.id, p.name]));
  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    name: productNameMap.get(p.productId) ?? "Producto",
    quantity: p._sum.quantity ?? 0,
    revenue: p._sum.total ?? 0,
  }));

  const topSellersRaw = await prisma.sale.groupBy({
    by: ["ownerId"],
    where: saleWhereBase,
    _sum: { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });
  const ownerIds = topSellersRaw.map((s) => s.ownerId).filter((id): id is string => !!id);
  const owners = await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } });
  const ownerNameMap = new Map(owners.map((o) => [o.id, o.name]));
  const topSellers = topSellersRaw.map((s) => ({
    ownerId: s.ownerId,
    name: s.ownerId ? ownerNameMap.get(s.ownerId) ?? "—" : "Sin asignar",
    total: s._sum.total ?? 0,
    count: s._count,
  }));

  const salesChart = await buildSalesChart(saleWhereBase, range);

  return {
    kpis: {
      salesToday,
      salesMonth,
      salesYear,
      leadsTotal,
      leadsNew,
      leadsHot,
      opportunitiesOpen,
      opportunitiesWon,
      opportunitiesLost,
      conversionRate,
      avgTicket: salesAgg._avg.total ?? 0,
      pipelineValue: pipelineAgg._sum.value ?? 0,
      pendingFollowups,
      newCustomers: newCustomersMonth,
      totalSalesCount: salesAgg._count,
    },
    topProducts,
    topSellers,
    salesChart,
  };
}

async function sumSales(where: Record<string, unknown>) {
  const agg = await prisma.sale.aggregate({ where, _sum: { total: true } });
  return agg._sum.total ?? 0;
}

async function buildSalesChart(saleWhereBase: Record<string, unknown>, range: DashboardFilters["range"]) {
  const now = new Date();
  const buckets: { label: string; from: Date; to: Date }[] = [];

  if (range === "day") {
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      buckets.push({ label: format(day, "EEE d", { locale: es }), from: startOfDay(day), to: startOfDay(subDays(day, -1)) });
    }
  } else if (range === "week") {
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { locale: es });
      buckets.push({
        label: `Sem ${format(weekStart, "d MMM", { locale: es })}`,
        from: weekStart,
        to: startOfWeek(subWeeks(now, i - 1), { locale: es }),
      });
    }
  } else if (range === "month") {
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      buckets.push({
        label: format(monthStart, "MMM yy", { locale: es }),
        from: monthStart,
        to: startOfMonth(subMonths(now, i - 1)),
      });
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const yearStart = startOfYear(subYears(now, i));
      buckets.push({
        label: format(yearStart, "yyyy"),
        from: yearStart,
        to: startOfYear(subYears(now, i - 1)),
      });
    }
  }

  const results = [];
  for (const bucket of buckets) {
    const total = await sumSales({ ...saleWhereBase, saleDate: { gte: bucket.from, lt: bucket.to } });
    results.push({ label: bucket.label, total });
  }
  return results;
}
