import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await requireSession();
    if (!can(user.role, "viewReports")) throw new ApiError("No tienes permiso para ver reportes", 403);

    const companyId = user.companyId;

    const [contactsBySource, contactsByStatus, saleItems, pipelineByStage, tasksSummary] = await Promise.all([
      prisma.contact.groupBy({
        by: ["source"],
        where: { companyId },
        _count: true,
      }),
      prisma.contact.groupBy({
        by: ["status"],
        where: { companyId },
        _count: true,
      }),
      prisma.saleItem.findMany({
        where: { sale: { companyId, status: { not: "CANCELADA" } } },
        include: { product: { select: { name: true, cost: true } } },
      }),
      prisma.pipelineStage.findMany({
        where: { companyId },
        orderBy: { order: "asc" },
        include: { _count: { select: { opportunities: true } }, opportunities: { select: { value: true } } },
      }),
      prisma.task.groupBy({ by: ["status"], where: { companyId }, _count: true }),
    ]);

    const profitabilityMap = new Map<string, { name: string; revenue: number; cost: number; quantity: number }>();
    for (const item of saleItems) {
      const key = item.product.name;
      const existing = profitabilityMap.get(key) ?? { name: key, revenue: 0, cost: 0, quantity: 0 };
      existing.revenue += item.total;
      existing.cost += item.product.cost * item.quantity;
      existing.quantity += item.quantity;
      profitabilityMap.set(key, existing);
    }
    const profitability = Array.from(profitabilityMap.values())
      .map((p) => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0 }))
      .sort((a, b) => b.profit - a.profit);

    const pipeline = pipelineByStage.map((s) => ({
      stage: s.name,
      count: s._count.opportunities,
      value: s.opportunities.reduce((sum, o) => sum + o.value, 0),
    }));

    return NextResponse.json({
      leadsBySource: contactsBySource.map((s) => ({ source: s.source ?? "Sin especificar", count: s._count })),
      leadsByStatus: contactsByStatus.map((s) => ({ status: s.status, count: s._count })),
      profitability,
      pipeline,
      tasksSummary: tasksSummary.map((t) => ({ status: t.status, count: t._count })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
