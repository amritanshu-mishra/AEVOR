import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goals, milestones, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z
    .enum(["active", "completed", "paused", "archived"])
    .optional(),
  targetDate: z.string().datetime().nullable().optional(),
  position: z.number().int().min(0).optional(),
  milestoneId: z.string().uuid().optional(),
});

async function userOwnsProject(projectId: string, userId: string) {
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

async function userOwnsMilestone(
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = updateProjectSchema.parse(await request.json());

    const project = await userOwnsProject(id, user.id);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    if (body.milestoneId) {
      const milestone = await userOwnsMilestone(
        body.milestoneId,
        user.id,
      );

      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found" },
          { status: 404 },
        );
      }
    }

    const [updatedProject] = await db
      .update(projects)
      .set({
        ...(body.title !== undefined && {
          title: body.title,
        }),

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

        ...(body.milestoneId !== undefined && {
          milestoneId: body.milestoneId,
        }),

        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid project data" },
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
      { error: "Failed to update project" },
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

    const project = await userOwnsProject(id, user.id);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    await db
      .delete(projects)
      .where(eq(projects.id, id));

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
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}