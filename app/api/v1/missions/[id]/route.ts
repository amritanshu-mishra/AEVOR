import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { missions } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const updateMissionSchema = z.object({
  status: z.enum(["planned", "completed", "cancelled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const { status } = updateMissionSchema.parse(await request.json());

    const [mission] = await db
      .update(missions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();

    if (!mission || mission.userId !== user.id) {
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid mission data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update mission" },
      { status: 500 },
    );
  }
}