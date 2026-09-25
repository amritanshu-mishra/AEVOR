"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type GoalStatus = "active" | "completed" | "paused" | "archived";

type MilestoneStatus =
  | "active"
  | "completed"
  | "paused"
  | "archived";

type ProjectStatus =
  | "active"
  | "completed"
  | "paused"
  | "archived";

type Milestone = {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  targetDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  progress: number;
  totalMissions: number;
  completedMissions: number;
};

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  progress: number;
  milestoneCount: number;
  completedMilestones: number;
  milestones: Milestone[];
};

type Project = {
  id: string;
  milestoneId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  targetDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type ProgressResponse = {
  overallProgress: number;
  goals: Goal[];
};

const goalStatusLabel: Record<GoalStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  archived: "Archived",
};

const milestoneStatusLabel: Record<MilestoneStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  archived: "Archived",
};

const projectStatusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  archived: "Archived",
};

function formatDate(date: string | null) {
  if (!date) return "No target date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const [milestoneDrafts, setMilestoneDrafts] = useState<
    Record<string, string>
  >({});

  const [projectDrafts, setProjectDrafts] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [creatingMilestone, setCreatingMilestone] = useState<
    string | null
  >(null);
  const [creatingProject, setCreatingProject] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      apiFetch("/api/v1/progress"),
      apiFetch("/api/v1/projects"),
    ])
      .then(async ([progressResponse, projectsResponse]) => {
        if (!progressResponse.ok || !projectsResponse.ok) {
          throw new Error("Failed to load goals");
        }

        const [progressData, projectData] =
          await Promise.all([
            progressResponse.json() as Promise<ProgressResponse>,
            projectsResponse.json() as Promise<Project[]>,
          ]);

        setGoals(progressData.goals);
        setOverallProgress(progressData.overallProgress);
        setProjects(projectData);
      })
      .catch(() => {
        setError("Unable to load your goals.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function refreshData() {
    const [progressResponse, projectsResponse] =
      await Promise.all([
        apiFetch("/api/v1/progress"),
        apiFetch("/api/v1/projects"),
      ]);

    if (!progressResponse.ok || !projectsResponse.ok) {
      throw new Error("Failed to refresh goals");
    }

    const [progressData, projectData] = await Promise.all([
      progressResponse.json() as Promise<ProgressResponse>,
      projectsResponse.json() as Promise<Project[]>,
    ]);

    setGoals(progressData.goals);
    setOverallProgress(progressData.overallProgress);
    setProjects(projectData);
  }

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setCreatingGoal(true);
      setError("");

      const response = await apiFetch("/api/v1/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate
            ? new Date(`${targetDate}T23:59:59`).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal");
      }

      await refreshData();

      setTitle("");
      setDescription("");
      setTargetDate("");
    } catch {
      setError("Unable to create the goal.");
    } finally {
      setCreatingGoal(false);
    }
  }

  async function updateGoal(id: string, status: GoalStatus) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/goals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      await refreshData();
    } catch {
      setError("Unable to update the goal.");
    }
  }

  async function deleteGoal(id: string) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/goals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      await refreshData();
    } catch {
      setError("Unable to delete the goal.");
    }
  }

  async function createMilestone(
    event: FormEvent<HTMLFormElement>,
    goalId: string,
  ) {
    event.preventDefault();

    const milestoneTitle = milestoneDrafts[goalId]?.trim();

    if (!milestoneTitle) return;

    const goal = goals.find((item) => item.id === goalId);

    if (!goal) return;

    try {
      setCreatingMilestone(goalId);
      setError("");

      const response = await apiFetch("/api/v1/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalId,
          title: milestoneTitle,
          position: goal.milestones.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create milestone");
      }

      await refreshData();

      setMilestoneDrafts((current) => ({
        ...current,
        [goalId]: "",
      }));
    } catch {
      setError("Unable to create the milestone.");
    } finally {
      setCreatingMilestone(null);
    }
  }

  async function updateMilestone(
    id: string,
    status: MilestoneStatus,
  ) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/milestones/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update milestone");
      }

      await refreshData();
    } catch {
      setError("Unable to update the milestone.");
    }
  }

  async function deleteMilestone(id: string) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/milestones/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete milestone");
      }

      await refreshData();
    } catch {
      setError("Unable to delete the milestone.");
    }
  }

  async function createProject(
    event: FormEvent<HTMLFormElement>,
    milestoneId: string,
  ) {
    event.preventDefault();

    const projectTitle = projectDrafts[milestoneId]?.trim();

    if (!projectTitle) return;

    const milestoneProjects = projects.filter(
      (project) => project.milestoneId === milestoneId,
    );

    try {
      setCreatingProject(milestoneId);
      setError("");

      const response = await apiFetch("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          milestoneId,
          title: projectTitle,
          position: milestoneProjects.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      await refreshData();

      setProjectDrafts((current) => ({
        ...current,
        [milestoneId]: "",
      }));
    } catch {
      setError("Unable to create the project.");
    } finally {
      setCreatingProject(null);
    }
  }

  async function updateProject(
    id: string,
    status: ProjectStatus,
  ) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      await refreshData();
    } catch {
      setError("Unable to update the project.");
    }
  }

  async function deleteProject(id: string) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      await refreshData();
    } catch {
      setError("Unable to delete the project.");
    }
  }

  const activeGoals = goals.filter(
    (goal) => goal.status === "active",
  );

  const completedGoals = goals.filter(
    (goal) => goal.status === "completed",
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          DIRECTION
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#12352B] md:text-5xl">
          Goals
        </h1>

        <p className="mt-4 max-w-2xl text-[#5E6963]">
          Define what matters, then turn it into measurable
          execution.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={createGoal}
          className="h-fit rounded-2xl border border-[#DDE2DE] bg-white p-6"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-[#B99A5B]">
            NEW GOAL
          </p>

          <div className="mt-5 space-y-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full rounded-xl border border-[#DDE2DE] px-4 py-3 text-sm outline-none transition focus:border-[#12352B]"
            />

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Why does this matter?"
              rows={4}
              className="w-full resize-none rounded-xl border border-[#DDE2DE] px-4 py-3 text-sm outline-none transition focus:border-[#12352B]"
            />

            <input
              type="date"
              value={targetDate}
              onChange={(event) =>
                setTargetDate(event.target.value)
              }
              className="w-full rounded-xl border border-[#DDE2DE] px-4 py-3 text-sm outline-none transition focus:border-[#12352B]"
            />

            <button
              type="submit"
              disabled={creatingGoal || !title.trim()}
              className="w-full rounded-xl bg-[#12352B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B211A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingGoal ? "Creating..." : "Create goal"}
            </button>
          </div>
        </form>

        <div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#DDE2DE] bg-white p-5">
              <p className="text-sm text-[#89918C]">
                Overall progress
              </p>

              <p className="mt-2 text-3xl font-semibold text-[#12352B]">
                {loading ? "—" : `${overallProgress}%`}
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDE2DE] bg-white p-5">
              <p className="text-sm text-[#89918C]">Active</p>

              <p className="mt-2 text-3xl font-semibold text-[#12352B]">
                {loading ? "—" : activeGoals.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDE2DE] bg-white p-5">
              <p className="text-sm text-[#89918C]">
                Completed
              </p>

              <p className="mt-2 text-3xl font-semibold text-[#12352B]">
                {loading ? "—" : completedGoals.length}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {loading ? (
              <div className="rounded-2xl border border-[#DDE2DE] bg-white p-8 text-sm text-[#89918C]">
                Loading goals...
              </div>
            ) : goals.length === 0 ? (
              <div className="rounded-2xl border border-[#DDE2DE] bg-white p-8">
                <h2 className="text-xl font-semibold text-[#12352B]">
                  No goals yet.
                </h2>

                <p className="mt-2 text-sm text-[#5E6963]">
                  Create your first goal and connect it to your
                  daily work.
                </p>
              </div>
            ) : (
              goals.map((goal) => (
                <article
                  key={goal.id}
                  className="rounded-2xl border border-[#DDE2DE] bg-white p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-[#12352B]">
                          {goal.title}
                        </h2>

                        <span className="rounded-full bg-[#F0F2EF] px-3 py-1 text-xs font-medium text-[#5E6963]">
                          {goalStatusLabel[goal.status]}
                        </span>
                      </div>

                      {goal.description && (
                        <p className="mt-2 text-sm leading-6 text-[#5E6963]">
                          {goal.description}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-[#89918C]">
                        Target: {formatDate(goal.targetDate)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {goal.status === "active" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void updateGoal(
                                goal.id,
                                "completed",
                              )
                            }
                            className="rounded-lg border border-[#C8D0CA] px-3 py-2 text-xs font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
                          >
                            Complete
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void updateGoal(
                                goal.id,
                                "paused",
                              )
                            }
                            className="rounded-lg border border-[#C8D0CA] px-3 py-2 text-xs font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
                          >
                            Pause
                          </button>
                        </>
                      )}

                      {goal.status === "paused" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateGoal(goal.id, "active")
                          }
                          className="rounded-lg border border-[#C8D0CA] px-3 py-2 text-xs font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
                        >
                          Resume
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void deleteGoal(goal.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#EEF1EE] pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-[#B99A5B]">
                          MILESTONES
                        </p>

                        <p className="mt-1 text-sm text-[#5E6963]">
                          {goal.completedMilestones} of{" "}
                          {goal.milestoneCount} completed
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-[#12352B]">
                        {goal.progress}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF1EE]">
                      <div
                        className="h-full rounded-full bg-[#12352B] transition-all"
                        style={{
                          width: `${goal.progress}%`,
                        }}
                      />
                    </div>

                    <form
                      onSubmit={(event) =>
                        void createMilestone(event, goal.id)
                      }
                      className="mt-5 flex gap-2"
                    >
                      <input
                        value={milestoneDrafts[goal.id] ?? ""}
                        onChange={(event) =>
                          setMilestoneDrafts((current) => ({
                            ...current,
                            [goal.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a milestone..."
                        className="min-w-0 flex-1 rounded-xl border border-[#DDE2DE] px-4 py-2.5 text-sm outline-none transition focus:border-[#12352B]"
                      />

                      <button
                        type="submit"
                        disabled={
                          creatingMilestone === goal.id ||
                          !milestoneDrafts[goal.id]?.trim()
                        }
                        className="rounded-xl bg-[#12352B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B211A] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {creatingMilestone === goal.id
                          ? "Adding..."
                          : "Add"}
                      </button>
                    </form>

                    {goal.milestones.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {[...goal.milestones]
                          .sort(
                            (a, b) =>
                              a.position - b.position,
                          )
                          .map((milestone) => {
                            const milestoneProjects =
                              projects
                                .filter(
                                  (project) =>
                                    project.milestoneId ===
                                    milestone.id,
                                )
                                .sort(
                                  (a, b) =>
                                    a.position - b.position,
                                );

                            return (
                              <div
                                key={milestone.id}
                                className="rounded-xl bg-[#F7F8F6] p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                      milestone.status ===
                                      "completed"
                                        ? "bg-[#2F7D5B]"
                                        : "bg-[#B99A5B]"
                                    }`}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p
                                          className={`text-sm font-medium ${
                                            milestone.status ===
                                            "completed"
                                              ? "text-[#89918C] line-through"
                                              : "text-[#12352B]"
                                          }`}
                                        >
                                          {milestone.title}
                                        </p>

                                        <p className="mt-1 text-xs text-[#89918C]">
                                          {
                                            milestoneStatusLabel[
                                              milestone.status
                                            ]
                                          }{" "}
                                          ·{" "}
                                          {
                                            milestone.completedMissions
                                          }{" "}
                                          of{" "}
                                          {
                                            milestone.totalMissions
                                          }{" "}
                                          missions
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 flex-wrap gap-2">
                                        {milestone.status ===
                                          "active" && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                void updateMilestone(
                                                  milestone.id,
                                                  "completed",
                                                )
                                              }
                                              className="text-xs font-semibold text-[#12352B] hover:underline"
                                            >
                                              Complete
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                void updateMilestone(
                                                  milestone.id,
                                                  "paused",
                                                )
                                              }
                                              className="text-xs font-semibold text-[#5E6963] hover:underline"
                                            >
                                              Pause
                                            </button>
                                          </>
                                        )}

                                        {milestone.status ===
                                          "paused" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void updateMilestone(
                                                milestone.id,
                                                "active",
                                              )
                                            }
                                            className="text-xs font-semibold text-[#12352B] hover:underline"
                                          >
                                            Resume
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            void deleteMilestone(
                                              milestone.id,
                                            )
                                          }
                                          className="text-xs font-semibold text-red-600 hover:underline"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E9E5]">
                                        <div
                                          className="h-full rounded-full bg-[#2F7D5B] transition-all"
                                          style={{
                                            width: `${milestone.progress}%`,
                                          }}
                                        />
                                      </div>

                                      <span className="w-10 text-right text-xs font-semibold text-[#12352B]">
                                        {milestone.progress}%
                                      </span>
                                    </div>

                                    <form
                                      onSubmit={(event) =>
                                        void createProject(
                                          event,
                                          milestone.id,
                                        )
                                      }
                                      className="mt-4 flex gap-2"
                                    >
                                      <input
                                        value={
                                          projectDrafts[
                                            milestone.id
                                          ] ?? ""
                                        }
                                        onChange={(event) =>
                                          setProjectDrafts(
                                            (current) => ({
                                              ...current,
                                              [milestone.id]:
                                                event.target
                                                  .value,
                                            }),
                                          )
                                        }
                                        placeholder="Add a project..."
                                        className="min-w-0 flex-1 rounded-lg border border-[#DDE2DE] bg-white px-3 py-2 text-xs outline-none focus:border-[#12352B]"
                                      />

                                      <button
                                        type="submit"
                                        disabled={
                                          creatingProject ===
                                            milestone.id ||
                                          !projectDrafts[
                                            milestone.id
                                          ]?.trim()
                                        }
                                        className="rounded-lg border border-[#C8D0CA] px-3 py-2 text-xs font-semibold text-[#12352B] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {creatingProject ===
                                        milestone.id
                                          ? "Adding..."
                                          : "Add"}
                                      </button>
                                    </form>

                                    {milestoneProjects.length >
                                      0 && (
                                      <div className="mt-4 space-y-2 border-l border-[#DDE2DE] pl-4">
                                        {milestoneProjects.map(
                                          (project) => (
                                            <div
                                              key={project.id}
                                              className="rounded-lg bg-white px-3 py-3"
                                            >
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                  <p
                                                    className={`text-sm font-medium ${
                                                      project.status ===
                                                      "completed"
                                                        ? "text-[#89918C] line-through"
                                                        : "text-[#12352B]"
                                                    }`}
                                                  >
                                                    {
                                                      project.title
                                                    }
                                                  </p>

                                                  <p className="mt-1 text-xs text-[#89918C]">
                                                    {
                                                      projectStatusLabel[
                                                        project.status
                                                      ]
                                                    }{" "}
                                                    · Target:{" "}
                                                    {formatDate(
                                                      project.targetDate,
                                                    )}
                                                  </p>
                                                </div>

                                                <div className="flex shrink-0 gap-2">
                                                  {project.status ===
                                                    "active" && (
                                                    <>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          void updateProject(
                                                            project.id,
                                                            "completed",
                                                          )
                                                        }
                                                        className="text-xs font-semibold text-[#12352B] hover:underline"
                                                      >
                                                        Complete
                                                      </button>

                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          void updateProject(
                                                            project.id,
                                                            "paused",
                                                          )
                                                        }
                                                        className="text-xs font-semibold text-[#5E6963] hover:underline"
                                                      >
                                                        Pause
                                                      </button>
                                                    </>
                                                  )}

                                                  {project.status ===
                                                    "paused" && (
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        void updateProject(
                                                          project.id,
                                                          "active",
                                                        )
                                                      }
                                                      className="text-xs font-semibold text-[#12352B] hover:underline"
                                                    >
                                                      Resume
                                                    </button>
                                                  )}

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      void deleteProject(
                                                        project.id,
                                                      )
                                                    }
                                                    className="text-xs font-semibold text-red-600 hover:underline"
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}