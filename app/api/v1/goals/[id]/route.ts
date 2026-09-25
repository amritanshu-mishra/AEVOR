import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["active", "completed", "paused", "archived"]).optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = updateGoalSchema.parse(await request.json());

    const [goal] = await db
      .update(goals)
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
        updatedAt: new Date(),
      })
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
      .returning();

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid goal data" },
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
      { error: "Failed to update goal" },
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

    const [goal] = await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
      .returning();

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 },
      );
    }

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
      { error: "Failed to delete goal" },
      { status: 500 },
    );
  }
}