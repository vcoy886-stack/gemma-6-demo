import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { ownerFilter } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await requireSession();
    const scope = ownerFilter(user.role, user.id);

    const conversations = await prisma.conversation.findMany({
      where: { channel: "WHATSAPP", contact: { companyId: user.companyId, ...scope } },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, phone: true, score: true, scoreLevel: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(conversations);
  } catch (err) {
    return handleApiError(err);
  }
}
