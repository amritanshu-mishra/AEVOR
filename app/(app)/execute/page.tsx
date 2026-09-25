"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import FocusAnalytics from "@/components/aevor/FocusAnalytics";
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

type MissionStatus = "planned" | "completed" | "cancelled";

type Goal = {
  id: string;
  title: string;
  status: GoalStatus;
};

type Milestone = {
  id: string;
  goalId: string;
  title: string;
  status: MilestoneStatus;
};

type Project = {
  id: string;
  milestoneId: string;
  title: string;
  status: ProjectStatus;
};

type Mission = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: MissionStatus;
  milestoneId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

type FocusSession = {
  id: string;
  userId: string;
  missionId: string | null;
  subject: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
};

type FocusResponse = {
  sessions: FocusSession[];
  active: FocusSession | null;
};

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDueAt(date: string | null) {
  if (!date) return "No deadline";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function ExecutePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(
    [],
  );
  const [activeFocus, setActiveFocus] =
    useState<FocusSession | null>(null);

  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] =
    useState("");
  const [missionDueAt, setMissionDueAt] = useState("");

  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] =
    useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [focusSubject, setFocusSubject] = useState("");
  const [selectedFocusMissionId, setSelectedFocusMissionId] =
    useState("");

  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creatingMission, setCreatingMission] = useState(false);
  const [startingFocus, setStartingFocus] = useState(false);
  const [stoppingFocus, setStoppingFocus] = useState(false);
  const [error, setError] = useState("");

  const availableMilestones = useMemo(
    () =>
      milestones.filter(
        (milestone) =>
          milestone.goalId === selectedGoalId &&
          milestone.status === "active",
      ),
    [milestones, selectedGoalId],
  );

  const availableProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.milestoneId === selectedMilestoneId &&
          project.status === "active",
      ),
    [projects, selectedMilestoneId],
  );

  const goalById = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal])),
    [goals],
  );

  const milestoneById = useMemo(
    () =>
      new Map(
        milestones.map((milestone) => [milestone.id, milestone]),
      ),
    [milestones],
  );

  const projectById = useMemo(
    () =>
      new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const selectedFocusMission = missions.find(
    (mission) => mission.id === selectedFocusMissionId,
  );

  const openMissions = missions.filter(
    (mission) => mission.status === "planned",
  );

  const completedMissions = missions.filter(
    (mission) => mission.status === "completed",
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch("/api/v1/missions"),
      apiFetch("/api/v1/goals"),
      apiFetch("/api/v1/milestones"),
      apiFetch("/api/v1/projects"),
      apiFetch("/api/v1/focus"),
    ])
      .then(
        async ([
          missionsResponse,
          goalsResponse,
          milestonesResponse,
          projectsResponse,
          focusResponse,
        ]) => {
          if (
            !missionsResponse.ok ||
            !goalsResponse.ok ||
            !milestonesResponse.ok ||
            !projectsResponse.ok ||
            !focusResponse.ok
          ) {
            throw new Error("Failed to load execution data");
          }

          const [
            missionData,
            goalData,
            milestoneData,
            projectData,
            focusData,
          ] = await Promise.all([
            missionsResponse.json() as Promise<Mission[]>,
            goalsResponse.json() as Promise<Goal[]>,
            milestonesResponse.json() as Promise<Milestone[]>,
            projectsResponse.json() as Promise<Project[]>,
            focusResponse.json() as Promise<FocusResponse>,
          ]);

          if (cancelled) return;

          setMissions(missionData);
          setGoals(goalData);
          setMilestones(milestoneData);
          setProjects(projectData);
          setFocusSessions(focusData.sessions);
          setActiveFocus(focusData.active);
        },
      )
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load your execution data.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeFocus) return;

    const interval = window.setInterval(() => {
      const startedAt = new Date(
        activeFocus.startedAt,
      ).getTime();

      setElapsed(
        Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000),
        ),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeFocus]);

  async function createMission(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!missionTitle.trim()) return;

    try {
      setCreatingMission(true);
      setError("");

      const response = await apiFetch("/api/v1/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: missionTitle.trim(),
          description:
            missionDescription.trim() || undefined,
          dueAt: missionDueAt
            ? new Date(missionDueAt).toISOString()
            : undefined,
          milestoneId: selectedMilestoneId || null,
          projectId: selectedProjectId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create mission");
      }

      const mission: Mission = await response.json();

      setMissions((current) => [mission, ...current]);

      setMissionTitle("");
      setMissionDescription("");
      setMissionDueAt("");
      setSelectedGoalId("");
      setSelectedMilestoneId("");
      setSelectedProjectId("");
    } catch {
      setError("Unable to create the mission.");
    } finally {
      setCreatingMission(false);
    }
  }

  async function updateMission(
    id: string,
    status: MissionStatus,
  ) {
    try {
      setError("");

      const response = await apiFetch(`/api/v1/missions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update mission");
      }

      const updatedMission: Mission = await response.json();

      setMissions((current) =>
        current.map((mission) =>
          mission.id === id ? updatedMission : mission,
        ),
      );
    } catch {
      setError("Unable to update the mission.");
    }
  }

  async function startFocus() {
    const subject = focusSubject.trim();

    if (!subject || activeFocus) return;

    try {
      setStartingFocus(true);
      setError("");

      const response = await apiFetch("/api/v1/focus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          missionId:
            selectedFocusMissionId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start focus");
      }

      const session: FocusSession = await response.json();

      setActiveFocus(session);
      setElapsed(0);
    } catch {
      setError("Unable to start the focus session.");
    } finally {
      setStartingFocus(false);
    }
  }

  async function stopFocus() {
    if (!activeFocus) return;

    try {
      setStoppingFocus(true);
      setError("");

      const response = await apiFetch(
        `/api/v1/focus/${activeFocus.id}/stop`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to stop focus");
      }

      const completedSession: FocusSession =
        await response.json();

      setFocusSessions((current) => [
        completedSession,
        ...current,
      ]);

      setActiveFocus(null);
      setElapsed(0);
    } catch {
      setError("Unable to stop the focus session.");
    } finally {
      setStoppingFocus(false);
    }
  }

  function focusMission(mission: Mission) {
    setSelectedFocusMissionId(mission.id);
    setFocusSubject(mission.title);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          EXECUTION
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#12352B] md:text-5xl">
          Execute
        </h1>

        <p className="mt-4 max-w-2xl text-[#5E6963]">
          Turn your plans into focused work.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <form
            onSubmit={createMission}
            className="rounded-2xl border border-[#DDE2DE] bg-white p-6"
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-[#B99A5B]">
              NEW MISSION
            </p>

            <div className="mt-5 space-y-4">
              <select
                value={selectedGoalId}
                onChange={(event) => {
                  setSelectedGoalId(event.target.value);
                  setSelectedMilestoneId("");
                  setSelectedProjectId("");
                }}
                className="w-full rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#12352B]"
              >
                <option value="">
                  No goal — standalone mission
                </option>

                {goals
                  .filter((goal) => goal.status === "active")
                  .map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
              </select>

              {selectedGoalId && (
                <select
                  value={selectedMilestoneId}
                  onChange={(event) => {
                    setSelectedMilestoneId(
                      event.target.value,
                    );
                    setSelectedProjectId("");
                  }}
                  className="w-full rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#12352B]"
                >
                  <option value="">No milestone</option>

                  {availableMilestones.map((milestone) => (
                    <option
                      key={milestone.id}
                      value={milestone.id}
                    >
                      {milestone.title}
                    </option>
                  ))}
                </select>
              )}

              {selectedMilestoneId && (
                <select
                  value={selectedProjectId}
                  onChange={(event) =>
                    setSelectedProjectId(event.target.value)
                  }
                  className="w-full rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#12352B]"
                >
                  <option value="">No project</option>

                  {availableProjects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.title}
                    </option>
                  ))}
                </select>
              )}

              <input
                value={missionTitle}
                onChange={(event) =>
                  setMissionTitle(event.target.value)
                }
                placeholder="What will you do?"
                className="w-full rounded-xl border border-[#DDE2DE] px-4 py-3 text-sm outline-none focus:border-[#12352B]"
              />

              <textarea
                value={missionDescription}
                onChange={(event) =>
                  setMissionDescription(event.target.value)
                }
                placeholder="Add context..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[#DDE2DE] px-4 py-3 text-sm outline-none focus:border-[#12352B]"
              />

              <input
                type="datetime-local"
                value={missionDueAt}
                onChange={(event) =>
                  setMissionDueAt(event.target.value)
                }
                className="w-full rounded-xl border border-[#DDE2DE] px-4 py-3 text-sm outline-none focus:border-[#12352B]"
              />

              <button
                type="submit"
                disabled={
                  creatingMission || !missionTitle.trim()
                }
                className="w-full rounded-xl bg-[#12352B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B211A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingMission
                  ? "Creating..."
                  : "Create mission"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl bg-[#12352B] p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#D8C38E]">
                  FOCUS
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {activeFocus
                    ? activeFocus.subject
                    : "Ready when you are."}
                </h2>
              </div>

              {activeFocus && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  Active
                </span>
              )}
            </div>

            <p className="mt-6 font-mono text-4xl tracking-tight">
              {formatTime(elapsed)}
            </p>

            {activeFocus ? (
              <button
                type="button"
                onClick={() => void stopFocus()}
                disabled={stoppingFocus}
                className="mt-6 w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#12352B] disabled:opacity-50"
              >
                {stoppingFocus ? "Stopping..." : "Stop focus"}
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                <input
                  value={focusSubject}
                  onChange={(event) =>
                    setFocusSubject(event.target.value)
                  }
                  placeholder="What are you working on?"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40"
                />

                <select
                  value={selectedFocusMissionId}
                  onChange={(event) => {
                    const missionId = event.target.value;

                    setSelectedFocusMissionId(missionId);

                    const mission = missions.find(
                      (item) => item.id === missionId,
                    );

                    if (mission) {
                      setFocusSubject(mission.title);
                    }
                  }}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/40"
                >
                  <option
                    value=""
                    className="text-[#12352B]"
                  >
                    Standalone focus
                  </option>

                  {openMissions.map((mission) => (
                    <option
                      key={mission.id}
                      value={mission.id}
                      className="text-[#12352B]"
                    >
                      {mission.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void startFocus()}
                  disabled={
                    startingFocus || !focusSubject.trim()
                  }
                  className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#12352B] disabled:opacity-50"
                >
                  {startingFocus
                    ? "Starting..."
                    : "Start focus"}
                </button>
              </div>
            )}

            {selectedFocusMission && !activeFocus && (
              <p className="mt-4 text-xs text-white/60">
                Linked to: {selectedFocusMission.title}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#DDE2DE] bg-white p-5">
              <p className="text-sm text-[#89918C]">
                Open missions
              </p>

              <p className="mt-2 text-3xl font-semibold text-[#12352B]">
                {openMissions.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDE2DE] bg-white p-5">
              <p className="text-sm text-[#89918C]">
                Completed
              </p>

              <p className="mt-2 text-3xl font-semibold text-[#12352B]">
                {completedMissions.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#B99A5B]">
                MISSIONS
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#12352B]">
                What needs to be done
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="py-6 text-sm text-[#89918C]">
                  Loading missions...
                </p>
              ) : missions.length === 0 ? (
                <div className="rounded-xl bg-[#F7F8F6] p-6">
                  <p className="font-medium text-[#12352B]">
                    Nothing here yet.
                  </p>

                  <p className="mt-2 text-sm text-[#5E6963]">
                    Create a mission and start executing.
                  </p>
                </div>
              ) : (
                missions.map((mission) => {
                  const project = mission.projectId
                    ? projectById.get(mission.projectId)
                    : undefined;

                  const milestone = mission.milestoneId
                    ? milestoneById.get(mission.milestoneId)
                    : undefined;

                  const goal = milestone
                    ? goalById.get(milestone.goalId)
                    : undefined;

                  const completed =
                    mission.status === "completed";

                  return (
                    <article
                      key={mission.id}
                      className="rounded-xl border border-[#EEF1EE] p-4"
                    >
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            void updateMission(
                              mission.id,
                              completed
                                ? "planned"
                                : "completed",
                            )
                          }
                          aria-label={
                            completed
                              ? "Reopen mission"
                              : "Complete mission"
                          }
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                            completed
                              ? "border-[#2F7D5B] bg-[#2F7D5B] text-white"
                              : "border-[#C8D0CA] hover:border-[#12352B]"
                          }`}
                        >
                          {completed && (
                            <span className="text-xs">
                              ✓
                            </span>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3
                                className={`font-semibold ${
                                  completed
                                    ? "text-[#89918C] line-through"
                                    : "text-[#12352B]"
                                }`}
                              >
                                {mission.title}
                              </h3>

                              {mission.description && (
                                <p className="mt-1 text-sm leading-6 text-[#5E6963]">
                                  {mission.description}
                                </p>
                              )}
                            </div>

                            {!completed && (
                              <button
                                type="button"
                                onClick={() =>
                                  focusMission(mission)
                                }
                                disabled={Boolean(activeFocus)}
                                className="shrink-0 rounded-lg border border-[#C8D0CA] px-3 py-2 text-xs font-semibold text-[#12352B] hover:bg-[#F0F2EF] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Focus
                              </button>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#89918C]">
                            {goal && (
                              <span>
                                Goal: {goal.title}
                              </span>
                            )}

                            {milestone && (
                              <span>
                                Milestone: {milestone.title}
                              </span>
                            )}

                            {project && (
                              <span>
                                Project: {project.title}
                              </span>
                            )}

                            <span>
                              {formatDueAt(mission.dueAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <FocusAnalytics sessions={focusSessions} />
        </div>
      </div>
    </section>
  );
}