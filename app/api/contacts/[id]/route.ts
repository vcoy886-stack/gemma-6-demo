import { NextRequest, NextResponse } from "next/server";
import type { ContactStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { contactSchema } from "@/lib/validation";
import { can } from "@/lib/permissions";
import { triggerAutomations } from "@/lib/automations";
import { addScoreEvent } from "@/lib/scoring";

async function loadContactOrThrow(id: string, companyId: string) {
  const contact = await prisma.contact.findFirst({ where: { id, companyId } });
  if (!contact) throw new ApiError("Contacto no encontrado", 404);
  return contact;
}

function assertCanAccess(user: { role: Role; id: string }, contact: { ownerId: string | null }) {
  if (can(user.role, "viewAllContacts")) return;
  if (contact.ownerId !== user.id) throw new ApiError("No tienes acceso a este contacto", 403);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const contact = await prisma.contact.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        owner: { select: { id: true, name: true } },
        scoreEvents: { orderBy: { createdAt: "desc" }, take: 20 },
        activities: { orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { name: true } } } },
        opportunities: { include: { stage: true, product: true }, orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueDate: "asc" } },
        conversations: {
          orderBy: { startedAt: "desc" },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        },
        quotes: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } },
        sales: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } },
      },
    });
    if (!contact) throw new ApiError("Contacto no encontrado", 404);
    assertCanAccess(user, contact);
    return NextResponse.json(contact);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const existing = await loadContactOrThrow(id, user.companyId);
    assertCanAccess(user, existing);

    const body = contactSchema.partial().parse(await req.json());

    const statusChanged = body.status && body.status !== existing.status;

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.whatsapp !== undefined ? { whatsapp: body.whatsapp } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
        ...(body.source !== undefined ? { source: body.source } : {}),
        ...(body.status !== undefined ? { status: body.status as ContactStatus } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.ownerId !== undefined ? { ownerId: body.ownerId } : {}),
        ...(body.nextFollowUpAt !== undefined
          ? { nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null }
          : {}),
      },
    });

    if (statusChanged) {
      await prisma.activity.create({
        data: {
          contactId: id,
          userId: user.id,
          type: "STATUS_CHANGE",
          description: `Estado cambiado de ${existing.status} a ${updated.status}`,
        },
      });
      if (updated.status === "PERDIDO") {
        await addScoreEvent(id, "MARCADO_PERDIDO", { userId: user.id });
      }
      if (updated.status === "GANADO") {
        await triggerAutomations("SALE_WON", { companyId: user.companyId, contactId: id });
      }
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
    await loadContactOrThrow(id, user.companyId);
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
