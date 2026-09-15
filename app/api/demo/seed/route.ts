import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";
import { seedDemoData } from "@/lib/demo-seed";

export async function POST() {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageSettings")) throw new ApiError("Solo un administrador puede cargar datos demo", 403);

    const existing = await prisma.contact.count({ where: { companyId: user.companyId, isDemo: true } });
    if (existing > 0) {
      throw new ApiError("Ya existen datos de demostración. Elimínalos primero si quieres regenerarlos.", 409);
    }

    const result = await seedDemoData(user.companyId, user.id);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
