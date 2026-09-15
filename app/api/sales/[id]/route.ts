import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";

const statusSchema = z.object({
  status: z.enum(["PENDIENTE", "PAGADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const sale = await prisma.sale.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        contact: true,
        owner: { select: { name: true } },
        items: { include: { product: true } },
        payments: true,
      },
    });
    if (!sale) throw new ApiError("Venta no encontrada", 404);
    return NextResponse.json(sale);
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
    const existing = await prisma.sale.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Venta no encontrada", 404);

    const body = statusSchema.parse(await req.json());

    const updated = await prisma.sale.update({ where: { id }, data: { status: body.status } });

    if (body.status === "PAGADA" || body.status === "COMPLETADA") {
      const existingPayment = await prisma.payment.findFirst({ where: { saleId: id, status: "PAGADO" } });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            saleId: id,
            amount: existing.total,
            method: existing.paymentMethod ?? "No especificado",
            status: "PAGADO",
            paidAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
