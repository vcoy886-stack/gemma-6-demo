import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { routeQuestion } from "@/lib/ai/router";
import { refineWithClaude, isAiGenerationEnabled } from "@/lib/ai/claude";

const bodySchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const { message, conversationId } = bodySchema.parse(await req.json());

    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.aiConversation.create({
        data: { userId: user.id, title: message.slice(0, 60) },
      });
      convId = conv.id;
    } else {
      const owned = await prisma.aiConversation.findFirst({ where: { id: convId, userId: user.id } });
      if (!owned) {
        const conv = await prisma.aiConversation.create({ data: { userId: user.id, title: message.slice(0, 60) } });
        convId = conv.id;
      }
    }

    await prisma.aiMessage.create({ data: { aiConversationId: convId, role: "USER", content: message } });

    const { factsText, skipRefinement } = await routeQuestion(
      { id: user.id, role: user.role, companyId: user.companyId, name: user.name },
      message
    );

    let reply = factsText;
    if (!skipRefinement && isAiGenerationEnabled()) {
      const refined = await refineWithClaude({ userQuestion: message, facts: factsText, userName: user.name });
      if (refined) reply = refined;
    }

    if (!isAiGenerationEnabled() && !skipRefinement) {
      reply += "\n\n(Modo determinista: configura ANTHROPIC_API_KEY para respuestas generadas con IA.)";
    }

    await prisma.aiMessage.create({ data: { aiConversationId: convId, role: "ASSISTANT", content: reply } });

    return NextResponse.json({ reply, conversationId: convId });
  } catch (err) {
    return handleApiError(err);
  }
}
