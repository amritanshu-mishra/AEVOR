"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import FocusAnalytics from "@/components/aevor/FocusAnalytics";

type MissionStatus = "planned" | "completed" | "cancelled";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  status: MissionStatus;
};

type FocusSession = {
  id: string;
  missionId: string | null;
  subject: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  status: "active" | "completed" | "cancelled";
};

type FocusData = {
  sessions: FocusSession[];
  active: FocusSession | null;
};

const emptyFocusData: FocusData = {
  sessions: [],
  active: null,
};

function formatTime(seconds: number) {
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function ExecutePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [focusData, setFocusData] = useState<FocusData>(emptyFocusData);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [subject, setSubject] = useState("");

  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const activeSession = focusData.active;

  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/missions").then(async (response) => {
        if (!response.ok) throw new Error("Could not load missions");
        return response.json();
      }),
      apiFetch("/api/v1/focus").then(async (response) => {
        if (!response.ok) throw new Error("Could not load focus data");
        return response.json();
      }),
    ])
      .then(([missionData, focus]) => {
        setMissions(missionData);
        setFocusData(focus);
      })
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Could not load Execute",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeSession) return;

    const update = () => {
      setElapsed(
        Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000,
          ),
        ),
      );
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  async function createMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missionTitle = title.trim();

    if (!missionTitle) {
      setError("Enter a mission title.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await apiFetch("/api/v1/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: missionTitle,
          description: description.trim() || undefined,
        }),
      });

      const mission = await response.json();

      if (!response.ok) {
        throw new Error(mission.error || "Could not create mission");
      }

      setMissions((current) => [mission, ...current]);
      setTitle("");
      setDescription("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create mission",
      );
    } finally {
      setCreating(false);
    }
  }

  async function completeMission(missionId: string) {
    setError("");

    try {
      const response = await apiFetch(`/api/v1/missions/${missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      const mission = await response.json();

      if (!response.ok) {
        throw new Error(mission.error || "Could not complete mission");
      }

      setMissions((current) =>
        current.map((item) => (item.id === mission.id ? mission : item)),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not complete mission",
      );
    }
  }

  function selectMission(mission: Mission) {
    setSelectedMissionId(mission.id);
    setSubject(mission.title);
  }

  async function startFocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mission = missions.find((item) => item.id === selectedMissionId);
    const focusSubject = subject.trim() || mission?.title;

    if (!focusSubject) {
      setError("Select a mission or enter what you are working on.");
      return;
    }

    setError("");

    try {
      const response = await apiFetch("/api/v1/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: focusSubject,
          missionId: selectedMissionId || undefined,
        }),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(session.error || "Could not start focus");
      }

      setFocusData((current) => ({
        ...current,
        active: session,
      }));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not start focus",
      );
    }
  }

  async function stopFocus() {
    if (!activeSession) return;

    setError("");

    try {
      const response = await apiFetch(
        `/api/v1/focus/${activeSession.id}/stop`,
        { method: "POST" },
      );

      const session = await response.json();

      if (!response.ok) {
        throw new Error(session.error || "Could not stop focus");
      }

      setFocusData((current) => ({
        active: null,
        sessions: [session, ...current.sessions],
      }));
      setElapsed(0);
      setSelectedMissionId("");
      setSubject("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not stop focus",
      );
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F7F7F3]">
        <p className="text-sm text-[#5E6963]">Loading Aevor...</p>
      </section>
    );
  }

  const completed = missions.filter(
    (mission) => mission.status === "completed",
  ).length;

  const progress = missions.length
    ? Math.round((completed / missions.length) * 100)
    : 0;

  const planned = missions.filter(
    (mission) => mission.status === "planned",
  ).length;

  return (
    <section className="min-h-screen bg-[#F7F7F3]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#B99A5B]">
            EXECUTE
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#17211C] md:text-6xl">
                Do the work.
              </h1>

              <p className="mt-4 text-[#5E6963]">
                Turn intention into measurable action.
              </p>
            </div>

            <p className="text-sm text-[#89918C]">
              {planned} {planned === 1 ? "mission" : "missions"} remaining
            </p>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-[#E8C7C5] bg-[#FBEDEC] px-4 py-3 text-sm text-[#B94A48]">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          {/* Missions */}
          <section className="overflow-hidden rounded-[24px] border border-[#DDE2DE] bg-white">
            <div className="flex items-center justify-between border-b border-[#DDE2DE] px-6 py-5 md:px-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
                  TODAY&apos;S MISSIONS
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#12352B]">
                  {missions.length}{" "}
                  {missions.length === 1 ? "mission" : "missions"}
                </h2>
              </div>

              <span className="text-sm font-medium text-[#B99A5B]">
                {progress}%
              </span>
            </div>

            <div className="divide-y divide-[#EEF1EE]">
              {missions.length === 0 ? (
                <div className="px-6 py-12 text-center md:px-8">
                  <p className="font-semibold text-[#12352B]">
                    Start with one meaningful mission.
                  </p>

                  <p className="mt-2 text-sm text-[#5E6963]">
                    Decide what matters today and put it into motion.
                  </p>
                </div>
              ) : (
                missions.map((mission) => {
                  const completed = mission.status === "completed";

                  return (
                    <article
                      key={mission.id}
                      className="flex items-center gap-4 px-6 py-5 md:px-8"
                    >
                      <button
                        type="button"
                        disabled={completed}
                        onClick={() => completeMission(mission.id)}
                        aria-label={
                          completed
                            ? `${mission.title} completed`
                            : `Complete ${mission.title}`
                        }
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                          completed
                            ? "border-[#12352B] bg-[#12352B] text-white"
                            : "border-[#B99A5B] hover:bg-[#F0F2EF]"
                        }`}
                      >
                        {completed && "✓"}
                      </button>

                      <div className="min-w-0 flex-1">
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
                          <p className="mt-1 text-sm text-[#5E6963]">
                            {mission.description}
                          </p>
                        )}

                        <span className="mt-2 inline-flex rounded-full bg-[#F0F2EF] px-3 py-1 text-xs capitalize text-[#5E6963]">
                          {mission.status}
                        </span>
                      </div>

                      {!completed && !activeSession && (
                        <button
                          type="button"
                          onClick={() => selectMission(mission)}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-[#12352B] hover:bg-[#F0F2EF]"
                        >
                          Focus
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            <form
              onSubmit={createMission}
              className="border-t border-[#DDE2DE] bg-[#F7F7F3] p-5 md:p-6"
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
                NEW MISSION
              </p>

              <div className="mt-3 flex gap-3">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What will you accomplish?"
                  className="min-w-0 flex-1 rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm text-[#17211C] outline-none focus:border-[#12352B]"
                />

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#12352B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B211A] disabled:opacity-60"
                >
                  {creating ? "..." : "Add"}
                </button>
              </div>

              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description"
                className="mt-3 w-full rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm text-[#17211C] outline-none focus:border-[#12352B]"
              />
            </form>
          </section>

          {/* Focus */}
          <aside>
            <section className="rounded-[24px] bg-[#12352B] p-7 text-white">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#D5C08D]">
                FOCUS
              </p>

              {activeSession ? (
                <>
                  <p className="mt-6 truncate text-sm text-white/70">
                    {activeSession.subject}
                  </p>

                  <p className="mt-3 text-5xl font-semibold tracking-[-0.05em]">
                    {formatTime(elapsed)}
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    Focus in progress.
                  </p>

                  <button
                    type="button"
                    onClick={stopFocus}
                    className="mt-8 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#12352B] transition hover:bg-[#F0F2EF]"
                  >
                    Stop focus
                  </button>
                </>
              ) : (
                <form onSubmit={startFocus}>
                  <select
                    value={selectedMissionId}
                    onChange={(event) => {
                      const id = event.target.value;
                      setSelectedMissionId(id);

                      const mission = missions.find(
                        (item) => item.id === id,
                      );

                      setSubject(mission?.title ?? "");
                    }}
                    className="mt-6 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-[#17211C] outline-none"
                  >
                    <option value="">No mission selected</option>

                    {missions
                      .filter((mission) => mission.status === "planned")
                      .map((mission) => (
                        <option key={mission.id} value={mission.id}>
                          {mission.title}
                        </option>
                      ))}
                  </select>

                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="What are you working on?"
                    className="mt-3 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-[#17211C] outline-none"
                  />

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#12352B] transition hover:bg-[#F0F2EF]"
                  >
                    Start focus
                  </button>
                </form>
              )}
            </section>
          </aside>
        </div>

        <div className="mt-5">
          <FocusAnalytics sessions={focusData.sessions} />
        </div>
      </div>
    </section>
  );
}