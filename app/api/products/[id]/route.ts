import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { productSchema } from "@/lib/validation";
import { can } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { id, companyId: user.companyId },
      include: { category: true },
    });
    if (!product) throw new ApiError("Producto no encontrado", 404);
    return NextResponse.json(product);
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
    if (!can(user.role, "manageProducts")) throw new ApiError("No tienes permiso para editar productos", 403);
    const { id } = await params;
    const existing = await prisma.product.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Producto no encontrado", 404);

    const body = productSchema.partial().parse(await req.json());

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId || null } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.cost !== undefined ? { cost: body.cost } : {}),
        ...(body.stock !== undefined ? { stock: body.stock } : {}),
        ...(body.status !== undefined ? { status: body.status as never } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      },
    });

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
    const existing = await prisma.product.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Producto no encontrado", 404);
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
