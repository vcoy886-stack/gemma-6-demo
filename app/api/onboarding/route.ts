import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireSession();
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { onboardingStep: true, onboardingComplete: true },
    });
    return NextResponse.json(company);
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  step: z.number().int().min(0).max(8),
  complete: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = schema.parse(await req.json());

    const updated = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        onboardingStep: body.step,
        ...(body.complete !== undefined ? { onboardingComplete: body.complete } : {}),
      },
      select: { onboardingStep: true, onboardingComplete: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
