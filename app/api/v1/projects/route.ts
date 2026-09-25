import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goals, milestones, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

const projectSchema = z.object({
  milestoneId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  targetDate: z.string().datetime().optional(),
  position: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const milestoneId = new URL(request.url).searchParams.get(
      "milestoneId",
    );

    const conditions = [eq(goals.userId, user.id)];

    if (milestoneId) {
      if (!z.string().uuid().safeParse(milestoneId).success) {
        return NextResponse.json(
          { error: "Invalid milestone ID" },
          { status: 400 },
        );
      }

      conditions.push(eq(projects.milestoneId, milestoneId));
    }

    const userProjects = await db
      .select({
        id: projects.id,
        milestoneId: projects.milestoneId,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        targetDate: projects.targetDate,
        position: projects.position,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(milestones, eq(projects.milestoneId, milestones.id))
      .innerJoin(goals, eq(milestones.goalId, goals.id))
      .where(and(...conditions))
      .orderBy(asc(projects.position), asc(projects.createdAt));

    return NextResponse.json(userProjects);
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
    const body = projectSchema.parse(await request.json());

    const [milestone] = await db
      .select({
        id: milestones.id,
      })
      .from(milestones)
      .innerJoin(goals, eq(milestones.goalId, goals.id))
      .where(
        and(
          eq(milestones.id, body.milestoneId),
          eq(goals.userId, user.id),
        ),
      )
      .limit(1);

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        milestoneId: body.milestoneId,
        title: body.title,
        description: body.description || null,
        targetDate: body.targetDate
          ? new Date(body.targetDate)
          : null,
        position: body.position ?? 0,
      })
      .returning();

    return NextResponse.json(project, { status: 201 });
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
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}