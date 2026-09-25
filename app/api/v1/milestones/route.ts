import { asc, and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goals, milestones } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const milestoneSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  targetDate: z.string().datetime().optional(),
  position: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const goalId = new URL(request.url).searchParams.get("goalId");

    const conditions = [eq(goals.userId, user.id)];

    if (goalId) {
      conditions.push(eq(milestones.goalId, goalId));
    }

    const result = await db
      .select({ milestone: milestones })
      .from(milestones)
      .innerJoin(goals, eq(milestones.goalId, goals.id))
      .where(and(...conditions))
      .orderBy(asc(milestones.position), asc(milestones.createdAt));

    return NextResponse.json(result.map(({ milestone }) => milestone));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = milestoneSchema.parse(await request.json());

    const [goal] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.id, body.goalId), eq(goals.userId, user.id)))
      .limit(1);

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 },
      );
    }

    const [milestone] = await db
      .insert(milestones)
      .values({
        goalId: body.goalId,
        title: body.title,
        description: body.description || null,
        targetDate: body.targetDate
          ? new Date(body.targetDate)
          : null,
        position: body.position ?? 0,
      })
      .returning();

    return NextResponse.json(milestone, { status: 201 });
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
      { error: "Failed to create milestone" },
      { status: 500 },
    );
  }
}