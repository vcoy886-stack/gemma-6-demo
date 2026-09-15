import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";

const rowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  city: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  source: z.string().optional().default("Importación CSV"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const { rows } = (await req.json()) as { rows: unknown[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No hay filas para importar" }, { status: 400 });
    }

    const existing = await prisma.contact.findMany({
      where: { companyId: user.companyId },
      select: { phone: true, email: true },
    });
    const existingPhones = new Set(existing.map((c) => c.phone).filter(Boolean));
    const existingEmails = new Set(existing.map((c) => c.email?.toLowerCase()).filter(Boolean));

    let created = 0;
    let skippedInvalid = 0;
    let skippedDuplicate = 0;
    const seenInFile = new Set<string>();

    for (const raw of rows) {
      const parsed = rowSchema.safeParse(raw);
      if (!parsed.success) {
        skippedInvalid++;
        continue;
      }
      const row = parsed.data;
      const key = (row.phone || row.email || "").trim().toLowerCase();
      const emailKey = row.email?.toLowerCase();

      if (!row.phone && !row.email) {
        skippedInvalid++;
        continue;
      }

      const isDuplicate =
        (row.phone && existingPhones.has(row.phone)) ||
        (emailKey && existingEmails.has(emailKey)) ||
        (key && seenInFile.has(key));

      if (isDuplicate) {
        skippedDuplicate++;
        continue;
      }

      if (key) seenInFile.add(key);
      if (row.phone) existingPhones.add(row.phone);
      if (emailKey) existingEmails.add(emailKey);

      await prisma.contact.create({
        data: {
          companyId: user.companyId,
          firstName: row.firstName,
          lastName: row.lastName || null,
          phone: row.phone || null,
          email: row.email || null,
          city: row.city || null,
          companyName: row.companyName || null,
          source: row.source,
          ownerId: user.id,
          status: "NUEVO",
        },
      });
      created++;
    }

    return NextResponse.json({ created, skippedInvalid, skippedDuplicate });
  } catch (err) {
    return handleApiError(err);
  }
}
