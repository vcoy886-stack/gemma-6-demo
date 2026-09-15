import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "GERENTE", "VENDEDOR", "ASISTENTE"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageUsers")) throw new ApiError("No tienes permiso para editar usuarios", 403);

    const { id } = await params;
    const existing = await prisma.user.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new ApiError("Usuario no encontrado", 404);

    if (existing.id === user.id && existing.role === "ADMIN") {
      const body = await req.clone().json();
      if (body.role && body.role !== "ADMIN") {
        throw new ApiError("No puedes quitarte a ti mismo el rol de administrador", 400);
      }
    }

    const body = updateSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
