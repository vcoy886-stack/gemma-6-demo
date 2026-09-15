import { NextResponse } from "next/server";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { can } from "@/lib/permissions";
import { runScheduledAutomations } from "@/lib/automations";

/**
 * Ejecuta manualmente las automatizaciones basadas en tiempo (sin respuesta, cotizaciones
 * por vencer). En este entorno no hay un cron real disponible; en producción esta misma
 * ruta puede programarse con Vercel Cron u otro programador externo apuntando aquí.
 */
export async function POST() {
  try {
    const user = await requireSession();
    if (!can(user.role, "manageAutomations")) throw new ApiError("No tienes permiso", 403);
    const result = await runScheduledAutomations(user.companyId);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
