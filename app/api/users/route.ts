import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";
import { userSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireSession();
    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true, email: true, role: true, active: true, avatarColor: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageUsers")) throw new ApiError("No tienes permiso para crear usuarios", 403);

    const body = userSchema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ApiError("Ya existe un usuario con ese correo", 409);
    if (!body.password) throw new ApiError("La contraseña es obligatoria para usuarios nuevos", 422);

    const created = await prisma.user.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        active: body.active,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
