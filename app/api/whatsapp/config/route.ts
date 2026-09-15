import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await requireSession();
    const config = await prisma.whatsappConfig.findUnique({ where: { companyId: user.companyId } });

    const envTokenSet = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
    const connected = envTokenSet && Boolean(config?.phoneNumberId);

    return NextResponse.json({
      phoneNumberId: config?.phoneNumberId ?? "",
      businessAccountId: config?.businessAccountId ?? "",
      webhookVerifyToken: config?.webhookVerifyToken ?? "",
      envTokenConfigured: envTokenSet,
      connected,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  phoneNumberId: z.string().optional(),
  businessAccountId: z.string().optional(),
  webhookVerifyToken: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageSettings")) throw new ApiError("No tienes permiso para editar esta configuración", 403);

    const body = schema.parse(await req.json());

    const updated = await prisma.whatsappConfig.upsert({
      where: { companyId: user.companyId },
      update: body,
      create: { companyId: user.companyId, ...body },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
