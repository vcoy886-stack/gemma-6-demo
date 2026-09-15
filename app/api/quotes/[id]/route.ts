import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";

const statusSchema = z.object({
  status: z.enum(["BORRADOR", "ENVIADA", "VISTA", "ACEPTADA", "RECHAZADA", "VENCIDA"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const quote = await prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        contact: true,
        owner: { select: { name: true } },
        items: { include: { product: true } },
      },
    });
    if (!quote) throw new ApiError("Cotización no encontrada", 404);
    return NextResponse.json(quote);
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
    const existing = await prisma.quote.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Cotización no encontrada", 404);

    const body = statusSchema.parse(await req.json());

    const updated = await prisma.quote.update({ where: { id }, data: { status: body.status } });

    await prisma.activity.create({
      data: {
        contactId: existing.contactId,
        userId: user.id,
        type: "STATUS_CHANGE",
        description: `Cotización ${existing.number} marcada como ${body.status}`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
