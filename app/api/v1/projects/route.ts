import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  goals,
  milestones,
  missions,
  projects,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

function calculateProgress(completed: number, total: number) {
  return total > 0
    ? Math.round((completed / total) * 100)
    : 0;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const [userGoals, userMilestones, userProjects, userMissions] =
      await Promise.all([
        db
          .select()
          .from(goals)
          .where(eq(goals.userId, user.id)),

        db
          .select()
          .from(milestones)
          .innerJoin(
            goals,
            eq(milestones.goalId, goals.id),
          )
          .where(eq(goals.userId, user.id)),

        db
          .select()
          .from(projects)
          .innerJoin(
            milestones,
            eq(projects.milestoneId, milestones.id),
          )
          .innerJoin(
            goals,
            eq(milestones.goalId, goals.id),
          )
          .where(eq(goals.userId, user.id)),

        db
          .select({
            id: missions.id,
            milestoneId: missions.milestoneId,
            projectId: missions.projectId,
            title: missions.title,
            status: missions.status,
          })
          .from(missions)
          .where(eq(missions.userId, user.id)),
      ]);

    const missionsByProject = new Map<
      string,
      typeof userMissions
    >();

    const missionsByMilestone = new Map<
      string,
      typeof userMissions
    >();

    for (const mission of userMissions) {
      if (mission.projectId) {
        const existing =
          missionsByProject.get(mission.projectId) ?? [];

        existing.push(mission);
        missionsByProject.set(mission.projectId, existing);
      }

      if (mission.milestoneId) {
        const existing =
          missionsByMilestone.get(mission.milestoneId) ?? [];

        existing.push(mission);
        missionsByMilestone.set(
          mission.milestoneId,
          existing,
        );
      }
    }

    const projectsWithProgress = userProjects.map(
      ({ projects: project }) => {
        const projectMissions =
          missionsByProject.get(project.id) ?? [];

        const completedMissions = projectMissions.filter(
          (mission) => mission.status === "completed",
        ).length;

        return {
          ...project,
          progress: calculateProgress(
            completedMissions,
            projectMissions.length,
          ),
          totalMissions: projectMissions.length,
          completedMissions,
        };
      },
    );

    const projectsByMilestone = new Map<
      string,
      typeof projectsWithProgress
    >();

    for (const project of projectsWithProgress) {
      const existing =
        projectsByMilestone.get(project.milestoneId) ?? [];

      existing.push(project);
      projectsByMilestone.set(
        project.milestoneId,
        existing,
      );
    }

    const milestonesWithProgress = userMilestones.map(
      ({ milestones: milestone }) => {
        const milestoneMissions =
          missionsByMilestone.get(milestone.id) ?? [];

        const milestoneProjects =
          projectsByMilestone.get(milestone.id) ?? [];

        const completedMissions = milestoneMissions.filter(
          (mission) => mission.status === "completed",
        ).length;

        return {
          ...milestone,
          progress: calculateProgress(
            completedMissions,
            milestoneMissions.length,
          ),
          totalMissions: milestoneMissions.length,
          completedMissions,
          projectCount: milestoneProjects.length,
          completedProjects: milestoneProjects.filter(
            (project) => project.status === "completed",
          ).length,
          projects: milestoneProjects,
        };
      },
    );

    const milestonesByGoal = new Map<
      string,
      typeof milestonesWithProgress
    >();

    for (const milestone of milestonesWithProgress) {
      const existing =
        milestonesByGoal.get(milestone.goalId) ?? [];

      existing.push(milestone);
      milestonesByGoal.set(
        milestone.goalId,
        existing,
      );
    }

    const goalsWithProgress = userGoals.map((goal) => {
      const goalMilestones =
        milestonesByGoal.get(goal.id) ?? [];

      const progress = goalMilestones.length
        ? Math.round(
            goalMilestones.reduce(
              (total, milestone) =>
                total + milestone.progress,
              0,
            ) / goalMilestones.length,
          )
        : 0;

      return {
        ...goal,
        progress,
        milestoneCount: goalMilestones.length,
        completedMilestones: goalMilestones.filter(
          (milestone) =>
            milestone.status === "completed",
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