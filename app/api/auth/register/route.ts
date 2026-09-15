import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { handleApiError, ApiError } from "@/lib/api-utils";

const DEFAULT_STAGES = [
  { name: "Lead nuevo", order: 1, probability: 10 },
  { name: "Primer contacto", order: 2, probability: 20 },
  { name: "Calificación", order: 3, probability: 30 },
  { name: "Interesado", order: 4, probability: 45 },
  { name: "Cotización", order: 5, probability: 60 },
  { name: "Negociación", order: 6, probability: 75 },
  { name: "Cierre", order: 7, probability: 90 },
  { name: "Venta ganada", order: 8, probability: 100, isWon: true },
  { name: "Venta perdida", order: 9, probability: 0, isLost: true },
];

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ApiError("Ya existe una cuenta con ese correo", 409);

    const passwordHash = await hashPassword(body.password);

    const company = await prisma.company.create({
      data: {
        name: body.companyName,
        currency: "USD",
        pipelineStages: { create: DEFAULT_STAGES },
        whatsappConfig: { create: {} },
        users: {
          create: {
            name: body.name,
            email: body.email,
            passwordHash,
            role: "ADMIN",
          },
        },
      },
      include: { users: true },
    });

    const admin = company.users[0];

    await setSessionCookie({
      userId: admin.id,
      companyId: company.id,
      role: admin.role,
      name: admin.name,
      email: admin.email,
    });

    return NextResponse.json({ ok: true, companyId: company.id });
  } catch (err) {
    return handleApiError(err);
  }
}
