import { NextRequest, NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { getDashboardMetrics } from "@/lib/dashboard";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") ?? "month") as "day" | "week" | "month" | "year";
    const ownerId = searchParams.get("ownerId");
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    const metrics = await getDashboardMetrics({
      companyId: user.companyId,
      range,
      ownerId,
      productId,
      status,
    });

    return NextResponse.json(metrics);
  } catch (err) {
    return handleApiError(err);
  }
}
