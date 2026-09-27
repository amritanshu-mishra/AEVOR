import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  focusSessions,
  missions,
  proofs,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const proofSchema = z.object({
  missionId: z.string().uuid(),
  focusSessionId: z.string().uuid().optional(),
  type: z.enum(["note", "url"]),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
});

async function getOwnedMission(
  missionId: string,
  userId: string,
) {
  const [mission] = await db
    .select({
      id: missions.id,
    })
    .from(missions)
    .where(
      and(
        eq(missions.id, missionId),
        eq(missions.userId, userId),
      ),
    )
    .limit(1);

  return mission ?? null;
}

async function getOwnedFocusSession(
  focusSessionId: string,
  missionId: string,
  userId: string,
) {
  const [session] = await db
    .select({
      id: focusSessions.id,
    })
    .from(focusSessions)
    .where(
      and(
        eq(focusSessions.id, focusSessionId),
        eq(focusSessions.missionId, missionId),
        eq(focusSessions.userId, userId),
      ),
    )
    .limit(1);

  return session ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const missionId = new URL(request.url).searchParams.get(
      "missionId",
    );

    if (missionId && !z.string().uuid().safeParse(missionId).success) {
      return NextResponse.json(
        { error: "Invalid mission ID" },
        { status: 400 },
      );
    }

    const conditions = [eq(proofs.userId, user.id)];

    if (missionId) {
      conditions.push(eq(proofs.missionId, missionId));
    }

    const userProofs = await db
      .select()
      .from(proofs)
      .where(and(...conditions))
      .orderBy(desc(proofs.createdAt));

    return NextResponse.json(userProofs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = proofSchema.parse(await request.json());

    const mission = await getOwnedMission(
      body.missionId,
      user.id,
    );

    if (!mission) {
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 },
      );
    }

    if (body.focusSessionId) {
      const focusSession = await getOwnedFocusSession(
        body.focusSessionId,
        body.missionId,
        user.id,
      );

      if (!focusSession) {
        return NextResponse.json(
          { error: "Focus session not found" },
          { status: 404 },
        );
      }
    }

    const [proof] = await db
      .insert(proofs)
      .values({
        userId: user.id,
        missionId: body.missionId,
        focusSessionId: body.focusSessionId ?? null,
        type: body.type,
        title: body.title,
        content: body.content,
      })
      .returning();

    return NextResponse.json(proof, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid proof data" },
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
      { error: "Failed to create proof" },
      { status: 500 },
    );
  }
}