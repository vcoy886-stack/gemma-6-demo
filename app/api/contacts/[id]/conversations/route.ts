import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { addScoreEvent } from "@/lib/scoring";

const messageSchema = z.object({
  channel: z.enum(["WHATSAPP", "EMAIL", "MANUAL"]).default("WHATSAPP"),
  direction: z.enum(["IN", "OUT"]),
  content: z.string().min(1),
  conversationId: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const contact = await prisma.contact.findFirst({ where: { id, companyId: user.companyId } });
    if (!contact) throw new ApiError("Contacto no encontrado", 404);

    const body = messageSchema.parse(await req.json());

    let conversationId = body.conversationId;
    let isNewConversation = false;

    if (!conversationId) {
      const recent = await prisma.conversation.findFirst({
        where: { contactId: id, channel: body.channel },
        orderBy: { startedAt: "desc" },
      });
      if (recent) {
        conversationId = recent.id;
      } else {
        const conv = await prisma.conversation.create({
          data: { contactId: id, channel: body.channel },
        });
        conversationId = conv.id;
        isNewConversation = true;
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        direction: body.direction,
        content: body.content,
        sender: body.direction === "OUT" ? user.name : contact.firstName,
      },
    });

    await prisma.contact.update({ where: { id }, data: { lastContactAt: new Date() } });

    if (isNewConversation) {
      await addScoreEvent(id, "CONVERSACION_REGISTRADA", { userId: user.id });
    }
    if (body.direction === "IN") {
      await addScoreEvent(id, "RESPONDIO_SEGUIMIENTO", { userId: user.id });
    }

    return NextResponse.json({ conversationId, message }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
