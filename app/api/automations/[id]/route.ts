import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";

const updateSchema = z.object({ active: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageAutomations")) throw new ApiError("No tienes permiso", 403);
    const { id } = await params;
    const existing = await prisma.automation.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Automatización no encontrada", 404);

    const body = updateSchema.parse(await req.json());
    const updated = await prisma.automation.update({ where: { id }, data: { active: body.active } });
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
    if (!can(user.role, "manageAutomations")) throw new ApiError("No tienes permiso", 403);
    const { id } = await params;
    const existing = await prisma.automation.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Automatización no encontrada", 404);
    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
