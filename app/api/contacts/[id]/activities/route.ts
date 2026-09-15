import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { addScoreEvent, SCORE_REASONS, type ScoreReasonCode } from "@/lib/scoring";

const activitySchema = z.object({
  type: z.enum(["CALL", "EMAIL", "WHATSAPP", "MEETING", "NOTE"]),
  description: z.string().min(1, "Describe lo que ocurrió"),
  scoreReason: z.string().optional().nullable(),
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

    const body = activitySchema.parse(await req.json());

    const activity = await prisma.activity.create({
      data: {
        contactId: id,
        userId: user.id,
        type: body.type,
        description: body.description,
      },
    });

    await prisma.contact.update({
      where: { id },
      data: { lastContactAt: new Date() },
    });

    if (body.scoreReason && body.scoreReason in SCORE_REASONS) {
      await addScoreEvent(id, body.scoreReason as ScoreReasonCode, { userId: user.id });
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
