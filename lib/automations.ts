import { prisma } from "@/lib/prisma";
import { addScoreEvent } from "@/lib/scoring";
import type { ActionType, TriggerType } from "@prisma/client";

type EventPayload = {
  companyId: string;
  contactId?: string;
  opportunityId?: string;
  saleId?: string;
  extra?: Record<string, unknown>;
};

/** Ejecuta las acciones configuradas de una automatización sobre un evento. */
async function runActions(
  automationId: string,
  actions: { actionType: ActionType; actionConfig: string }[],
  payload: EventPayload
) {
  const results: string[] = [];
  for (const action of actions) {
    const config = JSON.parse(action.actionConfig || "{}");
    try {
      switch (action.actionType) {
        case "CREATE_TASK": {
          if (!payload.contactId && !payload.opportunityId) break;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (config.daysFromNow ?? 1));
          await prisma.task.create({
            data: {
              companyId: payload.companyId,
              contactId: payload.contactId,
              opportunityId: payload.opportunityId,
              title: config.title ?? "Tarea generada por automatización",
              priority: config.priority ?? "MEDIUM",
              dueDate,
            },
          });
          results.push(`Tarea creada: ${config.title ?? "sin título"}`);
          break;
        }
        case "MARK_PRIORITY": {
          if (!payload.contactId) break;
          await prisma.contact.update({
            where: { id: payload.contactId },
            data: { tags: config.tag ?? "prioridad-alta" },
          });
          results.push("Contacto marcado como prioridad alta");
          break;
        }
        case "CHANGE_STATUS": {
          if (!payload.contactId || !config.status) break;
          await prisma.contact.update({
            where: { id: payload.contactId },
            data: { status: config.status },
          });
          results.push(`Estado cambiado a ${config.status}`);
          break;
        }
        case "ADD_SCORE": {
          if (!payload.contactId) break;
          await addScoreEvent(payload.contactId, config.reasonCode ?? "AJUSTE_MANUAL", {
            customPoints: config.points,
            customLabel: config.label,
          });
          results.push("Puntuación ajustada");
          break;
        }
        case "CREATE_NOTIFICATION": {
          await prisma.notification.create({
            data: {
              companyId: payload.companyId,
              type: "AUTOMATION",
              title: config.title ?? "Automatización ejecutada",
              body: config.body ?? "",
            },
          });
          results.push("Notificación creada");
          break;
        }
      }
    } catch (err) {
      results.push(`Error ejecutando ${action.actionType}: ${(err as Error).message}`);
    }
  }

  await prisma.automationLog.create({
    data: {
      automationId,
      contactId: payload.contactId,
      opportunityId: payload.opportunityId,
      result: results.join(" | ") || "Sin acciones",
    },
  });
}

/** Dispara automatizaciones asociadas a un evento inmediato (crear lead, venta ganada, etc.) */
export async function triggerAutomations(triggerType: TriggerType, payload: EventPayload) {
  const automations = await prisma.automation.findMany({
    where: { companyId: payload.companyId, triggerType, active: true },
    include: { actions: { orderBy: { order: "asc" } } },
  });

  for (const automation of automations) {
    const config = JSON.parse(automation.triggerConfig || "{}");

    if (triggerType === "SCORE_ABOVE" && payload.extra?.score !== undefined) {
      const threshold = config.threshold ?? 70;
      if ((payload.extra.score as number) < threshold) continue;
    }

    await runActions(automation.id, automation.actions, payload);
  }
}

/**
 * Revisión programada de automatizaciones basadas en tiempo (sin respuesta hace X días,
 * cotizaciones por vencer). No hay un cron real disponible en este entorno de desarrollo:
 * este método debe invocarse desde /api/automations/run manualmente o mediante un
 * programador externo (ej. Vercel Cron / cron del sistema operativo) apuntando a esa ruta.
 */
export async function runScheduledAutomations(companyId: string) {
  const automations = await prisma.automation.findMany({
    where: {
      companyId,
      active: true,
      triggerType: { in: ["NO_RESPONSE_DAYS", "QUOTE_EXPIRING"] },
    },
    include: { actions: { orderBy: { order: "asc" } } },
  });

  let executedCount = 0;

  for (const automation of automations) {
    const config = JSON.parse(automation.triggerConfig || "{}");

    if (automation.triggerType === "NO_RESPONSE_DAYS") {
      const days = config.days ?? 3;
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);

      const contacts = await prisma.contact.findMany({
        where: {
          companyId,
          status: { notIn: ["GANADO", "PERDIDO"] },
          OR: [{ lastContactAt: { lt: threshold } }, { lastContactAt: null }],
        },
      });

      for (const contact of contacts) {
        await runActions(automation.id, automation.actions, { companyId, contactId: contact.id });
        executedCount++;
      }
    }

    if (automation.triggerType === "QUOTE_EXPIRING") {
      const days = config.daysBefore ?? 2;
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + days);

      const quotes = await prisma.quote.findMany({
        where: {
          companyId,
          status: { in: ["ENVIADA", "VISTA"] },
          validUntil: { lte: threshold, gte: new Date() },
        },
      });

      for (const quote of quotes) {
        await runActions(automation.id, automation.actions, {
          companyId,
          contactId: quote.contactId,
        });
        executedCount++;
      }
    }
  }

  return { executedCount };
}
