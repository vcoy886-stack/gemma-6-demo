import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { productSchema } from "@/lib/validation";
import { can } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");

    const where: Prisma.ProductWhereInput = {
      companyId: user.companyId,
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(search
        ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] }
        : {}),
    };

    const items = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageProducts")) throw new ApiError("No tienes permiso para crear productos", 403);

    const body = productSchema.parse(await req.json());

    const existingCode = await prisma.product.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: body.code } },
    });
    if (existingCode) throw new ApiError("Ya existe un producto con ese código", 409);

    const product = await prisma.product.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        code: body.code,
        categoryId: body.categoryId || null,
        description: body.description,
        price: body.price,
        cost: body.cost ?? 0,
        stock: body.stock ?? 0,
        status: (body.status as never) ?? "ACTIVO",
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
