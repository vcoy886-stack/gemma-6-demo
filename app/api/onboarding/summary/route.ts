import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireSession();
    const companyId = user.companyId;

    const [company, productsCount, contactsCount, usersCount, stagesCount, automationsCount, whatsappConfig] =
      await Promise.all([
        prisma.company.findUnique({ where: { id: companyId } }),
        prisma.product.count({ where: { companyId } }),
        prisma.contact.count({ where: { companyId } }),
        prisma.user.count({ where: { companyId } }),
        prisma.pipelineStage.count({ where: { companyId } }),
        prisma.automation.count({ where: { companyId } }),
        prisma.whatsappConfig.findUnique({ where: { companyId } }),
      ]);

    return NextResponse.json({
      companyInfoComplete: Boolean(company?.phone && company?.address),
      productsCount,
      contactsCount,
      usersCount,
      stagesCount,
      automationsCount,
      whatsappConfigured: Boolean(whatsappConfig?.phoneNumberId),
      currency: company?.currency,
      onboardingStep: company?.onboardingStep ?? 0,
      onboardingComplete: company?.onboardingComplete ?? false,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
