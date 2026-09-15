import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { saleSchema } from "@/lib/validation";
import { nextSaleNumber, computeTotals } from "@/lib/numbering";
import { ownerFilter } from "@/lib/permissions";
import { addScoreEvent } from "@/lib/scoring";
import { triggerAutomations } from "@/lib/automations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Prisma.SaleWhereInput = {
      companyId: user.companyId,
      ...ownerFilter(user.role, user.id),
      ...(status ? { status: status as never } : {}),
      ...(from || to
        ? {
            saleDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const sales = await prisma.sale.findMany({
      where,
      include: { contact: true, owner: { select: { name: true } }, items: { include: { product: true } } },
      orderBy: { saleDate: "desc" },
    });

    return NextResponse.json(sales);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = saleSchema.parse(await req.json());

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) }, companyId: user.companyId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = body.items.map((i) => {
      const product = productMap.get(i.productId);
      if (!product) throw new ApiError("Producto inválido en la venta", 422);
      const total = i.quantity * i.price - i.discount;
      return { productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount, total };
    });

    const { subtotal, tax, total } = computeTotals(items, body.discount, body.taxRate);
    const number = await nextSaleNumber(user.companyId);
    const status = (body.status as never) ?? "PENDIENTE";

    const sale = await prisma.sale.create({
      data: {
        companyId: user.companyId,
        number,
        contactId: body.contactId,
        ownerId: user.id,
        quoteId: body.quoteId || null,
        subtotal,
        discount: body.discount,
        tax,
        total,
        paymentMethod: body.paymentMethod,
        status,
        notes: body.notes,
        items: { create: items },
        ...(status === "PAGADA" || status === "COMPLETADA"
          ? { payments: { create: { amount: total, method: body.paymentMethod ?? "No especificado", status: "PAGADO", paidAt: new Date() } } }
          : {}),
      },
      include: { items: { include: { product: true } }, contact: true },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    if (body.quoteId) {
      await prisma.quote.update({ where: { id: body.quoteId }, data: { status: "ACEPTADA" } });
    }

    await prisma.contact.update({ where: { id: body.contactId }, data: { status: "GANADO" } });
    await addScoreEvent(body.contactId, "CLIENTE_RECURRENTE", { userId: user.id });

    await prisma.activity.create({
      data: {
        contactId: body.contactId,
        userId: user.id,
        type: "SYSTEM",
        description: `Venta ${sale.number} registrada por ${new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(total)}`,
      },
    });

    await triggerAutomations("SALE_WON", { companyId: user.companyId, contactId: body.contactId });

    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
