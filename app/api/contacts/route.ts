import { NextRequest, NextResponse } from "next/server";
import type { Prisma, ContactStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { contactSchema } from "@/lib/validation";
import { ownerFilter } from "@/lib/permissions";
import { triggerAutomations } from "@/lib/automations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const ownerId = searchParams.get("ownerId");
    const search = searchParams.get("search");
    const minScore = searchParams.get("minScore");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "25");

    const where: Prisma.ContactWhereInput = {
      companyId: user.companyId,
      ...ownerFilter(user.role, user.id),
      ...(status ? { status: status as ContactStatus } : {}),
      ...(source ? { source } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(minScore ? { score: { gte: Number(minScore) } } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
              { companyName: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { owner: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = contactSchema.parse(await req.json());

    const contact = await prisma.contact.create({
      data: {
        companyId: user.companyId,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        whatsapp: body.whatsapp,
        email: body.email || undefined,
        city: body.city,
        companyName: body.companyName,
        source: body.source,
        status: (body.status as ContactStatus) ?? "NUEVO",
        tags: body.tags,
        notes: body.notes,
        ownerId: body.ownerId ?? user.id,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
      },
    });

    await prisma.activity.create({
      data: {
        contactId: contact.id,
        userId: user.id,
        type: "SYSTEM",
        description: "Lead creado en el sistema",
      },
    });

    await triggerAutomations("LEAD_CREATED", { companyId: user.companyId, contactId: contact.id });

    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
