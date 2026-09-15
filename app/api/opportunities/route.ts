import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { opportunitySchema } from "@/lib/validation";
import { ownerFilter } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    const where: Prisma.OpportunityWhereInput = {
      companyId: user.companyId,
      ...ownerFilter(user.role, user.id),
      ...(ownerId ? { ownerId } : {}),
      ...(productId ? { productId } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, score: true, scoreLevel: true } },
        product: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        stage: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(opportunities);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = opportunitySchema.parse(await req.json());

    const opportunity = await prisma.opportunity.create({
      data: {
        companyId: user.companyId,
        contactId: body.contactId,
        productId: body.productId || null,
        title: body.title,
        value: body.value ?? 0,
        probability: body.probability ?? 50,
        stageId: body.stageId,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        ownerId: body.ownerId || user.id,
        nextAction: body.nextAction,
        notes: body.notes,
        lastContactAt: new Date(),
      },
      include: { stage: true, contact: true },
    });

    await prisma.activity.create({
      data: {
        contactId: body.contactId,
        opportunityId: opportunity.id,
        userId: user.id,
        type: "SYSTEM",
        description: `Oportunidad creada: ${opportunity.title}`,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
