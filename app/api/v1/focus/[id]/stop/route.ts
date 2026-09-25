import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const endedAt = new Date();

    const [session] = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.id, id),
          eq(focusSessions.userId, user.id),
          eq(focusSessions.status, "active"),
        ),
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Active focus session not found" },
        { status: 404 },
      );
    }

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (endedAt.getTime() - session.startedAt.getTime()) / 1000,
      ),
    );

    const [updated] = await db
      .update(focusSessions)
      .set({
        endedAt,
        durationSeconds,
        status: "completed",
      })
      .where(eq(focusSessions.id, session.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Stop focus error:", error);

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
      { error: "Failed to stop focus" },
      { status: 500 },
    );
  }
}