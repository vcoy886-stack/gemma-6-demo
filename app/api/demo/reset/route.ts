import { NextResponse } from "next/server";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";
import { resetDemoData } from "@/lib/demo-seed";

export async function POST() {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageSettings")) throw new ApiError("Solo un administrador puede eliminar datos demo", 403);

    const result = await resetDemoData(user.companyId);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
