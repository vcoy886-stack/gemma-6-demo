import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireSession();
    const stages = await prisma.pipelineStage.findMany({
      where: { companyId: user.companyId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(stages);
  } catch (err) {
    return handleApiError(err);
  }
}
