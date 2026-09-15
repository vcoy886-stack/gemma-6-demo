import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireSession();
    const categories = await prisma.category.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const { name } = z.object({ name: z.string().min(1) }).parse(await req.json());
    const category = await prisma.category.create({ data: { companyId: user.companyId, name } });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
