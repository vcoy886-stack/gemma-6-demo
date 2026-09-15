import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-utils";
import { taskSchema } from "@/lib/validation";
import { can } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");

    const where: Prisma.TaskWhereInput = {
      companyId: user.companyId,
      ...(can(user.role, "viewAllOpportunities") ? {} : { assignedToId: user.id }),
      ...(status ? { status: status as never } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, score: true, scoreLevel: true } },
        opportunity: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = taskSchema.parse(await req.json());

    const task = await prisma.task.create({
      data: {
        companyId: user.companyId,
        contactId: body.contactId || null,
        opportunityId: body.opportunityId || null,
        assignedToId: body.assignedToId || user.id,
        title: body.title,
        description: body.description,
        dueDate: new Date(body.dueDate),
        priority: body.priority,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
