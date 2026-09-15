import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { automationSchema } from "@/lib/validation";
import { can } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await requireSession();
    const automations = await prisma.automation.findMany({
      where: { companyId: user.companyId },
      include: { actions: true, _count: { select: { logs: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(automations);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageAutomations")) throw new ApiError("No tienes permiso para crear automatizaciones", 403);

    const body = automationSchema.parse(await req.json());

    const automation = await prisma.automation.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        triggerType: body.triggerType,
        triggerConfig: JSON.stringify(body.triggerConfig),
        active: body.active,
        actions: {
          create: body.actions.map((a, i) => ({
            actionType: a.actionType,
            actionConfig: JSON.stringify(a.actionConfig),
            order: i,
          })),
        },
      },
      include: { actions: true },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
