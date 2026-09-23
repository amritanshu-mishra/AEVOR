"use client";

import Link from "next/link";
import { auth } from "@/lib/firebase/client";

const stats = [
  ["Progress", "0%", "Today's execution"],
  ["Streak", "0 days", "Keep showing up"],
  ["XP", "0", "Earned through action"],
];

const actions = [
  ["Start Focus", "/execute"],
  ["Create Mission", "/execute"],
  ["Add Goal", "/goals"],
  ["Reflect", "/execute"],
];

export default function HomePage() {
  const name =
    auth.currentUser?.displayName?.split(" ")[0] ||
    auth.currentUser?.email?.split("@")[0] ||
    "there";

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          WELCOME BACK
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
          What matters today, {name}?
        </h1>

        <p className="mt-4 text-[#5E6963]">
          Focus on the work that moves your goals forward.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
          TODAY&apos;S EXECUTION
        </p>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#12352B]">
              Nothing planned yet.
            </h2>
            <p className="mt-2 text-sm text-[#5E6963]">
              Start with one meaningful mission.
            </p>
          </div>

          <Link
            href="/execute"
            className="rounded-xl bg-[#12352B] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0B211A]"
          >
            Create mission
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {stats.map(([label, value, description]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#DDE2DE] bg-white p-6"
          >
            <p className="text-sm text-[#89918C]">{label}</p>
            <p className="mt-3 text-4xl font-semibold text-[#12352B]">
              {value}
            </p>
            <p className="mt-2 text-sm text-[#5E6963]">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          QUICK ACTIONS
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="rounded-2xl border border-[#DDE2DE] bg-white p-5 transition hover:border-[#C8D0CA] hover:bg-[#F0F2EF]"
            >
              <p className="font-semibold text-[#12352B]">{label}</p>
              <p className="mt-2 text-sm text-[#5E6963]">
                {label === "Start Focus" && "Begin focused work."}
                {label === "Create Mission" && "Define what you will do."}
                {label === "Add Goal" && "Set a meaningful direction."}
                {label === "Reflect" && "Capture what you learned."}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          CURRENT GOAL
        </p>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#12352B]">
              No active goal
            </h2>
            <p className="mt-2 text-sm text-[#5E6963]">
              Your goals will connect direction with daily execution.
            </p>
          </div>

          <Link
            href="/goals"
            className="hidden rounded-xl border border-[#C8D0CA] px-5 py-3 text-sm font-semibold text-[#12352B] hover:bg-[#F0F2EF] sm:block"
          >
            View goals
          </Link>
        </div>
      </div>
    </section>
  );
}