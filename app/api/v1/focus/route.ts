import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { focusSessions, missions } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";


const startSchema = z.object({
  subject: z.string().trim().min(1).max(100),
  missionId: z.string().uuid().optional(),
});
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const [sessions, active] = await Promise.all([
      db
        .select()
        .from(focusSessions)
        .where(
          and(
            eq(focusSessions.userId, user.id),
            eq(focusSessions.status, "completed"),
          ),
        )
        .orderBy(desc(focusSessions.startedAt))
        .limit(100),

      db
        .select()
        .from(focusSessions)
        .where(
          and(
            eq(focusSessions.userId, user.id),
            eq(focusSessions.status, "active"),
          ),
        )
        .limit(1),
    ]);

    return NextResponse.json({
      sessions,
      active: active[0] ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = startSchema.parse(await request.json());

    if (body.missionId) {
      const [mission] = await db
        .select({ id: missions.id })
        .from(missions)
        .where(
          and(
            eq(missions.id, body.missionId),
            eq(missions.userId, user.id),
          ),
        )
        .limit(1);

      if (!mission) {
        return NextResponse.json(
          { error: "Mission not found" },
          { status: 404 },
        );
      }
    }

    const [active] = await db
      .select({ id: focusSessions.id })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, user.id),
          eq(focusSessions.status, "active"),
        ),
      )
      .limit(1);

    if (active) {
      return NextResponse.json(
        { error: "A focus session is already active" },
        { status: 409 },
      );
    }

    const [session] = await db
      .insert(focusSessions)
      .values({
        userId: user.id,
        missionId: body.missionId ?? null,
        subject: body.subject,
      })
      .returning();

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid focus data" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      {
        error:
          message === "USER_NOT_FOUND"
            ? "User not found"
            : "Unauthorized",
      },
      { status: message === "USER_NOT_FOUND" ? 404 : 401 },
    );
  }
}