import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const goalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  targetDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const userGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, user.id))
      .orderBy(desc(goals.createdAt));

    return NextResponse.json(userGoals);
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
    const body = goalSchema.parse(await request.json());

    const [goal] = await db
      .insert(goals)
      .values({
        userId: user.id,
        title: body.title,
        description: body.description || null,
        targetDate: body.targetDate
          ? new Date(body.targetDate)
          : null,
      })
      .returning();

    return NextResponse.json(goal, { status: 201 });
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
      { error: "Failed to create goal" },
      { status: 500 },
    );
  }
}