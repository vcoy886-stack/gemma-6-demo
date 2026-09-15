import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { opportunitySchema } from "@/lib/validation";
import { can } from "@/lib/permissions";
import { triggerAutomations } from "@/lib/automations";
import { addScoreEvent } from "@/lib/scoring";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const existing = await prisma.opportunity.findFirst({
      where: { id, companyId: user.companyId },
      include: { stage: true },
    });
    if (!existing) throw new ApiError("Oportunidad no encontrada", 404);
    if (!can(user.role, "viewAllOpportunities") && existing.ownerId !== user.id) {
      throw new ApiError("No tienes acceso a esta oportunidad", 403);
    }

    const body = opportunitySchema.partial().parse(await req.json());

    const stageChanged = body.stageId && body.stageId !== existing.stageId;
    const newStage = stageChanged
      ? await prisma.pipelineStage.findUnique({ where: { id: body.stageId! } })
      : existing.stage;

    const data: Record<string, unknown> = {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.value !== undefined ? { value: body.value } : {}),
      ...(body.probability !== undefined ? { probability: body.probability } : {}),
      ...(body.stageId !== undefined ? { stageId: body.stageId } : {}),
      ...(body.productId !== undefined ? { productId: body.productId || null } : {}),
      ...(body.expectedCloseDate !== undefined
        ? { expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null }
        : {}),
      ...(body.ownerId !== undefined ? { ownerId: body.ownerId } : {}),
      ...(body.nextAction !== undefined ? { nextAction: body.nextAction } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      lastContactAt: new Date(),
    };

    if (stageChanged && newStage?.isWon) {
      data.status = "WON";
      data.closedAt = new Date();
      if (body.probability === undefined) data.probability = 100;
    } else if (stageChanged && newStage?.isLost) {
      data.status = "LOST";
      data.closedAt = new Date();
      if (body.probability === undefined) data.probability = 0;
    } else if (stageChanged) {
      if (body.probability === undefined) data.probability = newStage?.probability ?? existing.probability;
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data,
      include: { stage: true, contact: true },
    });

    if (stageChanged) {
      await prisma.activity.create({
        data: {
          contactId: existing.contactId,
          opportunityId: id,
          userId: user.id,
          type: "STATUS_CHANGE",
          description: `Oportunidad movida a "${newStage?.name}"`,
        },
      });

      if (newStage?.isWon) {
        await prisma.contact.update({ where: { id: existing.contactId }, data: { status: "GANADO" } });
        await triggerAutomations("SALE_WON", { companyId: user.companyId, contactId: existing.contactId, opportunityId: id });
      } else if (newStage?.isLost) {
        await addScoreEvent(existing.contactId, "MARCADO_PERDIDO", { userId: user.id });
      }

      await triggerAutomations("OPPORTUNITY_STAGE_CHANGED", {
        companyId: user.companyId,
        contactId: existing.contactId,
        opportunityId: id,
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    if (!can(user.role, "deleteRecords")) throw new ApiError("No tienes permiso para eliminar", 403);
    const { id } = await params;
    const existing = await prisma.opportunity.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Oportunidad no encontrada", 404);
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
