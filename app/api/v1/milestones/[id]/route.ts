import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goals, milestones } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z
    .enum(["active", "completed", "paused", "archived"])
    .optional(),
  targetDate: z.string().datetime().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = updateMilestoneSchema.parse(await request.json());

    const [milestone] = await db
      .select({ id: milestones.id })
      .from(milestones)
      .innerJoin(goals, eq(milestones.goalId, goals.id))
      .where(and(eq(milestones.id, id), eq(goals.userId, user.id)))
      .limit(1);

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    const [updated] = await db
      .update(milestones)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.status !== undefined && {
          status: body.status,
        }),
        ...(body.targetDate !== undefined && {
          targetDate: body.targetDate
            ? new Date(body.targetDate)
            : null,
        }),
        ...(body.position !== undefined && {
          position: body.position,
        }),
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid milestone data" },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
      }

      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const [milestone] = await db
      .select({ id: milestones.id })
      .from(milestones)
      .innerJoin(goals, eq(milestones.goalId, goals.id))
      .where(and(eq(milestones.id, id), eq(goals.userId, user.id)))
      .limit(1);

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    await db
      .delete(milestones)
      .where(eq(milestones.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
      }

      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 },
    );
  }
}