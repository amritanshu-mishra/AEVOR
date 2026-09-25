"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type GoalStatus = "active" | "completed" | "paused" | "archived";

type GoalProgress = {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  targetDate: string | null;
  progress: number;
  milestoneCount: number;
  completedMilestones: number;
};

type ProgressData = {
  overallProgress: number;
  goals: GoalProgress[];
};

const actions = [
  ["Start Focus", "/execute", "Begin focused work."],
  ["Create Mission", "/execute", "Define what you will do."],
  ["Add Goal", "/goals", "Set a meaningful direction."],
  ["Reflect", "/execute", "Capture what you learned."],
];

export default function HomePage() {
  const [progress, setProgress] = useState<ProgressData>({
    overallProgress: 0,
    goals: [],
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [name, setName] = useState("there");

  

  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/progress"),
      apiFetch("/api/v1/auth/me"),
    ])
      .then(async ([progressResponse, userResponse]) => {
        if (!progressResponse.ok || !userResponse.ok) {
          throw new Error("Failed to load dashboard");
        }

        const progressData: ProgressData =
          await progressResponse.json();

        const userData = await userResponse.json();

        setProgress(progressData);

        const displayName =
          userData.displayName?.split(" ")[0] ||
          userData.email?.split("@")[0];

        if (displayName) {
          setName(displayName);
          window.localStorage.setItem(
            "aevor-user-name",
            displayName,
          );
        }
      })
      .catch(() => {
        setError("Unable to load your dashboard.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activeGoals = progress.goals.filter(
    (goal) => goal.status === "active",
  );

  const completedGoals = progress.goals.filter(
    (goal) => goal.status === "completed",
  );

  const currentGoal = activeGoals[0] ?? null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          WELCOME BACK
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#12352B] md:text-5xl">
          What matters today, {name}?
        </h1>

        <p className="mt-4 text-[#5E6963]">
          Focus on the work that moves your goals forward.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
              OVERALL PROGRESS
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#12352B]">
              {loading ? "—" : `${progress.overallProgress}%`}
            </h2>

            <p className="mt-2 text-sm text-[#5E6963]">
              Calculated from completed missions.
            </p>
          </div>

          <Link
            href="/execute"
            className="rounded-xl bg-[#12352B] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0B211A]"
          >
            Execute
          </Link>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#EEF1EE]">
          <div
            className="h-full rounded-full bg-[#12352B] transition-all"
            style={{
              width: `${progress.overallProgress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
          <p className="text-sm text-[#89918C]">Active goals</p>

          <p className="mt-3 text-4xl font-semibold text-[#12352B]">
            {loading ? "—" : activeGoals.length}
          </p>

          <p className="mt-2 text-sm text-[#5E6963]">
            Current directions
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
          <p className="text-sm text-[#89918C]">Completed goals</p>

          <p className="mt-3 text-4xl font-semibold text-[#12352B]">
            {loading ? "—" : completedGoals.length}
          </p>

          <p className="mt-2 text-sm text-[#5E6963]">
            Finished directions
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
          <p className="text-sm text-[#89918C]">Goals tracked</p>

          <p className="mt-3 text-4xl font-semibold text-[#12352B]">
            {loading ? "—" : progress.goals.length}
          </p>

          <p className="mt-2 text-sm text-[#5E6963]">
            Across your system
          </p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
              QUICK ACTIONS
            </p>

            <h2 className="mt-2 text-xl font-semibold text-[#12352B]">
              Keep moving
            </h2>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(([label, href, description]) => (
            <Link
              key={label}
              href={href}
              className="rounded-2xl border border-[#DDE2DE] bg-white p-5 transition hover:border-[#C8D0CA] hover:bg-[#F0F2EF]"
            >
              <p className="font-semibold text-[#12352B]">
                {label}
              </p>

              <p className="mt-2 text-sm text-[#5E6963]">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
              CURRENT GOAL
            </p>

            {currentGoal ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold text-[#12352B]">
                  {currentGoal.title}
                </h2>

                <p className="mt-2 text-sm text-[#5E6963]">
                  {currentGoal.milestoneCount} milestone
                  {currentGoal.milestoneCount === 1
                    ? ""
                    : "s"} ·{" "}
                  {currentGoal.completedMilestones} completed
                </p>

                <div className="mt-5 h-2 max-w-xl overflow-hidden rounded-full bg-[#EEF1EE]">
                  <div
                    className="h-full rounded-full bg-[#12352B] transition-all"
                    style={{
                      width: `${currentGoal.progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-[#89918C]">
                  {currentGoal.progress}% complete
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-semibold text-[#12352B]">
                  No active goal
                </h2>

                <p className="mt-2 text-sm text-[#5E6963]">
                  Create a goal to connect direction with daily
                  execution.
                </p>
              </>
            )}
          </div>

          <Link
            href="/goals"
            className="rounded-xl border border-[#C8D0CA] px-5 py-3 text-center text-sm font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
          >
            View goals
          </Link>
        </div>
      </div>
    </section>
  );
}