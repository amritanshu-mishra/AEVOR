import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals, milestones, missions } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const [userGoals, userMilestones, userMissions] =
      await Promise.all([
        db
          .select()
          .from(goals)
          .where(eq(goals.userId, user.id)),

        db
          .select({
            id: milestones.id,
            goalId: milestones.goalId,
            title: milestones.title,
            description: milestones.description,
            status: milestones.status,
            targetDate: milestones.targetDate,
            position: milestones.position,
            createdAt: milestones.createdAt,
            updatedAt: milestones.updatedAt,
          })
          .from(milestones)
          .innerJoin(goals, eq(milestones.goalId, goals.id))
          .where(eq(goals.userId, user.id)),

        db
          .select({
            id: missions.id,
            milestoneId: missions.milestoneId,
            title: missions.title,
            status: missions.status,
          })
          .from(missions)
          .where(eq(missions.userId, user.id)),
      ]);

    const milestonesWithProgress = userMilestones.map(
      (milestone) => {
        const milestoneMissions = userMissions.filter(
          (mission) => mission.milestoneId === milestone.id,
        );

        const completedMissions = milestoneMissions.filter(
          (mission) => mission.status === "completed",
        ).length;

        const totalMissions = milestoneMissions.length;

        const progress = totalMissions
          ? Math.round(
              (completedMissions / totalMissions) * 100,
            )
          : 0;

        return {
          ...milestone,
          progress,
          totalMissions,
          completedMissions,
        };
      },
    );

    const goalsWithProgress = userGoals.map((goal) => {
      const goalMilestones = milestonesWithProgress.filter(
        (milestone) => milestone.goalId === goal.id,
      );

      const progress = goalMilestones.length
        ? Math.round(
            goalMilestones.reduce(
              (total, milestone) => total + milestone.progress,
              0,
            ) / goalMilestones.length,
          )
        : 0;

      return {
        ...goal,
        progress,
        milestoneCount: goalMilestones.length,
        completedMilestones: goalMilestones.filter(
          (milestone) => milestone.status === "completed",
        ).length,
        milestones: goalMilestones,
      };
    });

    const activeGoals = goalsWithProgress.filter(
      (goal) => goal.status === "active",
    );

    const overallProgress = activeGoals.length
      ? Math.round(
          activeGoals.reduce(
            (total, goal) => total + goal.progress,
            0,
          ) / activeGoals.length,
        )
      : 0;

    return NextResponse.json({
      overallProgress,
      goals: goalsWithProgress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}