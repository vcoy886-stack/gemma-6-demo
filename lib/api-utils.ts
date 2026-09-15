import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Recupera la sesión + usuario activo desde BD, o lanza 401. Úsalo al inicio de cada route handler. */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new ApiError("No autenticado", 401);
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) throw new ApiError("Sesión inválida", 401);
  return user;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: err.issues },
      { status: 422 }
    );
  }
  console.error(err);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}
