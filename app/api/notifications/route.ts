import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireSession();
    const items = await prisma.notification.findMany({
      where: { companyId: user.companyId, OR: [{ userId: user.id }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(items);
  } catch (err) {
    return handleApiError(err);
  }
}
