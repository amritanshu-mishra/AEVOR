"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "completed" | "cancelled";
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

const emptyFocusData = {
  sessions: [] as FocusSession[],
  active: null as FocusSession | null,
};

export default function ExecutePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [focusData, setFocusData] = useState(emptyFocusData);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [subject, setSubject] = useState("");

  const [elapsed, setElapsed] = useState(0);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeSession = focusData.active;

  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/missions").then(async (res) => {
        if (!res.ok) throw new Error("Could not load missions");
        return res.json();
      }),
      apiFetch("/api/v1/focus").then(async (res) => {
        if (!res.ok) throw new Error("Could not load focus history");
        return res.json();
      }),
    ])
      .then(([missionData, focusData]) => {
        setMissions(missionData);
        setFocusData(focusData);
      })
      .catch((err) => setError(err.message))
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
    
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  async function createMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
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
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      const mission = await response.json();

      if (!response.ok) {
        throw new Error(mission.error || "Failed to create mission");
      }

      setMissions((current) => [mission, ...current]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function completeMission(id: string) {
    setError("");

    try {
      const response = await apiFetch(`/api/v1/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      const mission = await response.json();

      if (!response.ok) {
        throw new Error(mission.error || "Failed to complete mission");
      }

      setMissions((current) =>
        current.map((item) => (item.id === mission.id ? mission : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function startFocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedMission = missions.find(
      (mission) => mission.id === selectedMissionId,
    );

    const focusSubject = subject.trim() || selectedMission?.title;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      setSubject("");
      setElapsed(0);
      setSelectedMissionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const completed = missions.filter(
    (mission) => mission.status === "completed",
  ).length;

  const progress = missions.length
    ? Math.round((completed / missions.length) * 100)
    : 0;

  const chartData = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (6 - index));

      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const minutes =
        focusData.sessions
          .filter((session) => {
            const started = new Date(session.startedAt);
            return started >= date && started < next;
          })
          .reduce((total, session) => total + session.durationSeconds, 0) / 60;

      return {
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
        minutes: Math.round(minutes),
      };
    });
  }, [focusData.sessions]);

  const todayMinutes = chartData[6]?.minutes ?? 0;

  function formatTime(seconds: number) {
    return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F7F7F3]">
        <p className="text-sm text-[#5E6963]">Loading Aevor...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F7F7F3]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#B99A5B]">
            EXECUTE
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            Do the work.
          </h1>

          <p className="mt-4 text-[#5E6963]">
            Turn intention into measurable action.
          </p>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <section className="overflow-hidden rounded-[24px] border border-[#DDE2DE] bg-white">
            <div className="border-b border-[#DDE2DE] px-6 py-5 md:px-8">
              <div className="flex items-center justify-between">
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
            </div>

            <div className="divide-y divide-[#EEF1EE]">
              {missions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-lg font-semibold text-[#12352B]">
                    Start with one meaningful mission.
                  </p>
                </div>
              ) : (
                missions.map((mission) => (
                  <article
                    key={mission.id}
                    className="flex items-center gap-4 px-6 py-5 md:px-8"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        mission.status === "planned" &&
                        completeMission(mission.id)
                      }
                      disabled={mission.status !== "planned"}
                      aria-label={`Complete ${mission.title}`}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        mission.status === "completed"
                          ? "border-[#12352B] bg-[#12352B] text-white"
                          : "border-[#B99A5B] hover:bg-[#F0F2EF]"
                      }`}
                    >
                      {mission.status === "completed" && "✓"}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-semibold ${
                          mission.status === "completed"
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

                    {mission.status === "planned" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMissionId(mission.id);
                          setSubject(mission.title);
                        }}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-[#12352B] hover:bg-[#F0F2EF]"
                      >
                        Focus
                      </button>
                    )}
                  </article>
                ))
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
                  className="min-w-0 flex-1 rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#12352B]"
                />

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#12352B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B211A] disabled:opacity-60"
                >
                  {creating ? "..." : "Add"}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-[#B94A48]">{error}</p>
              )}
            </form>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#12352B] p-7 text-white">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#D5C08D]">
                FOCUS
              </p>

              {activeSession ? (
                <>
                  <p className="mt-5 text-sm text-white/65">
                    {activeSession.subject}
                  </p>

                  <p className="mt-4 text-5xl font-semibold tracking-[-0.05em]">
                    {formatTime(elapsed)}
                  </p>

                  <button
                    type="button"
                    onClick={stopFocus}
                    className="mt-8 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
                  >
                    Stop focus
                  </button>
                </>
              ) : (
                <form onSubmit={startFocus}>
                  <select
                    value={selectedMissionId}
                    onChange={(event) => {
                      setSelectedMissionId(event.target.value);

                      const mission = missions.find(
                        (item) => item.id === event.target.value,
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

                  <p className="mt-4 text-sm text-white/65">
                    Focus time will be recorded automatically.
                  </p>

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
                  >
                    Start focus
                  </button>
                </form>
              )}
            </section>

            <section className="rounded-[24px] border border-[#DDE2DE] bg-white p-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
                    TODAY
                  </p>

                  <p className="mt-3 text-4xl font-semibold text-[#12352B]">
                    {todayMinutes} min
                  </p>

                  <p className="mt-1 text-sm text-[#5E6963]">
                    focused today
                  </p>
                </div>

                <p className="text-sm text-[#89918C]">
                  {completed}/{missions.length}
                </p>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-5 rounded-[24px] border border-[#DDE2DE] bg-white p-6 md:p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#B99A5B]">
                FOCUS HISTORY
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-[#12352B]">
                Your last 7 days
              </h2>
            </div>

            <p className="text-sm text-[#89918C]">
              Minutes focused
            </p>
          </div>

          <div className="mt-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1EE" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="minutes"
                  fill="#B99A5B"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#DDE2DE] bg-white p-6 md:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
            RECENT FOCUS
          </p>

          <div className="mt-5 space-y-3">
            {focusData.sessions.length === 0 ? (
              <p className="text-sm text-[#5E6963]">
                Your completed focus sessions will appear here.
              </p>
            ) : (
              focusData.sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl bg-[#F7F7F3] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-[#12352B]">
                      {session.subject}
                    </p>

                    <p className="mt-1 text-xs text-[#89918C]">
                      {new Date(session.startedAt).toLocaleDateString(
                        "en-IN",
                      )}
                    </p>
                  </div>

                  <p className="text-sm font-medium text-[#5E6963]">
                    {Math.round(session.durationSeconds / 60)} min
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}