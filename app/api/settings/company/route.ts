import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { companySettingsSchema } from "@/lib/validation";
import { can } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await requireSession();
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new ApiError("Empresa no encontrada", 404);
    return NextResponse.json(company);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageSettings")) throw new ApiError("No tienes permiso para editar la configuración", 403);

    const body = companySettingsSchema.parse(await req.json());

    const updated = await prisma.company.update({
      where: { id: user.companyId },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
