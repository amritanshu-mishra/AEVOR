import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  goals,
  milestones,
  missions,
  projects,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const missionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.string().datetime().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

async function getOwnedProject(
  projectId: string,
  userId: string,
) {
  const [project] = await db
    .select({
      id: projects.id,
      milestoneId: projects.milestoneId,
    })
    .from(projects)
    .innerJoin(
      milestones,
      eq(projects.milestoneId, milestones.id),
    )
    .innerJoin(goals, eq(milestones.goalId, goals.id))
    .where(
      and(
        eq(projects.id, projectId),
        eq(goals.userId, userId),
      ),
    )
    .limit(1);

  return project ?? null;
}

async function getOwnedMilestone(
  milestoneId: string,
  userId: string,
) {
  const [milestone] = await db
    .select({
      id: milestones.id,
    })
    .from(milestones)
    .innerJoin(goals, eq(milestones.goalId, goals.id))
    .where(
      and(
        eq(milestones.id, milestoneId),
        eq(goals.userId, userId),
      ),
    )
    .limit(1);

  return milestone ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const userMissions = await db
      .select()
      .from(missions)
      .where(eq(missions.userId, user.id))
      .orderBy(desc(missions.createdAt));

    return NextResponse.json(userMissions);
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
    const body = missionSchema.parse(await request.json());

    let milestoneId = body.milestoneId ?? null;

    if (body.projectId) {
      const project = await getOwnedProject(
        body.projectId,
        user.id,
      );

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }

      if (
        body.milestoneId &&
        body.milestoneId !== project.milestoneId
      ) {
        return NextResponse.json(
          {
            error:
              "Project does not belong to the selected milestone",
          },
          { status: 400 },
        );
      }

      milestoneId = project.milestoneId;
    } else if (milestoneId) {
      const milestone = await getOwnedMilestone(
        milestoneId,
        user.id,
      );

      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found" },
          { status: 404 },
        );
      }
    }

    const [mission] = await db
      .insert(missions)
      .values({
        userId: user.id,
        milestoneId,
        projectId: body.projectId ?? null,
        title: body.title,
        description: body.description || null,
        dueAt: body.dueAt
          ? new Date(body.dueAt)
          : null,
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
      { error: "Failed to create mission" },
      { status: 500 },
    );
  }
}