import { NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { getProactiveAlerts } from "@/lib/ai/proactive";
import { isAiGenerationEnabled } from "@/lib/ai/claude";

export async function GET() {
  try {
    const user = await requireSession();
    const alerts = await getProactiveAlerts({
      id: user.id,
      role: user.role,
      companyId: user.companyId,
      name: user.name,
    });
    return NextResponse.json({ alerts, aiEnabled: isAiGenerationEnabled() });
  } catch (err) {
    return handleApiError(err);
  }
}
