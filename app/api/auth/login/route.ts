import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.active) throw new ApiError("Credenciales inválidas", 401);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw new ApiError("Credenciales inválidas", 401);

    await setSessionCookie({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
