import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { missions } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const createMissionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  dueAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const data = await db
      .select()
      .from(missions)
      .where(eq(missions.userId, user.id))
      .orderBy(desc(missions.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: message === "USER_NOT_FOUND" ? "User not found" : "Unauthorized" },
      { status: message === "USER_NOT_FOUND" ? 404 : 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = createMissionSchema.parse(await request.json());

    const [mission] = await db
      .insert(missions)
      .values({
        userId: user.id,
        title: body.title,
        description: body.description || null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
      })
      .returning();

    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid mission data" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: message === "USER_NOT_FOUND" ? "User not found" : "Unauthorized" },
      { status: message === "USER_NOT_FOUND" ? 404 : 401 },
    );
  }
}