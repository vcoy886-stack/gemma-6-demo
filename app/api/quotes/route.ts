import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { quoteSchema } from "@/lib/validation";
import { nextQuoteNumber, computeTotals } from "@/lib/numbering";
import { addScoreEvent } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const quotes = await prisma.quote.findMany({
      where: { companyId: user.companyId, ...(status ? { status: status as never } : {}) },
      include: { contact: true, owner: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = quoteSchema.parse(await req.json());

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) }, companyId: user.companyId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = body.items.map((i) => {
      const product = productMap.get(i.productId);
      if (!product) throw new Error("Producto inválido en la cotización");
      const total = i.quantity * i.price - i.discount;
      return { productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount, total };
    });

    const { subtotal, tax, total } = computeTotals(items, body.discount, body.taxRate);
    const number = await nextQuoteNumber(user.companyId);

    const quote = await prisma.quote.create({
      data: {
        companyId: user.companyId,
        number,
        contactId: body.contactId,
        ownerId: user.id,
        status: "BORRADOR",
        subtotal,
        discount: body.discount,
        tax,
        total,
        conditions: body.conditions,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        items: { create: items },
      },
      include: { items: { include: { product: true } }, contact: true },
    });

    await prisma.activity.create({
      data: {
        contactId: body.contactId,
        userId: user.id,
        type: "SYSTEM",
        description: `Cotización ${quote.number} creada por ${new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(total)}`,
      },
    });

    await addScoreEvent(body.contactId, "SOLICITO_COTIZACION", { userId: user.id });

    return NextResponse.json(quote, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
