"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FocusSession = {
  id: string;
  subject: string;
  startedAt: string;
  durationSeconds: number;
};

type Props = {
  sessions: FocusSession[];
};

const subjectColors = [
  "#12352B",
  "#B99A5B",
  "#477A9B",
  "#6B746F",
  "#2F7D5B",
];

function dayStart(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatMinutes(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export default function FocusAnalytics({ sessions }: Props) {
  const [view, setView] = useState<"today" | "week" | "month">("today");

  const today = dayStart(new Date());

  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (session) => dayStart(new Date(session.startedAt)).getTime() === today.getTime(),
      ),
    [sessions, today],
  );

  const todayBySubject = useMemo(() => {
    const map = new Map<string, number>();

    for (const session of todaySessions) {
      map.set(
        session.subject,
        (map.get(session.subject) ?? 0) + session.durationSeconds,
      );
    }

    return [...map].map(([subject, seconds]) => ({
      subject,
      minutes: Math.round(seconds / 60),
    }));
  }, [todaySessions]);

  const todayTotal = todaySessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );

  const weekData = useMemo(() => {
    const subjects = [...new Set(sessions.map((session) => session.subject))];
    const now = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = dayStart(now);
      date.setDate(now.getDate() - (6 - index));

      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const row: Record<string, string | number> = {
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      };

      for (const subject of subjects) {
        row[subject] = Math.round(
          sessions
            .filter((session) => {
              const started = new Date(session.startedAt);
              return (
                started >= date &&
                started < next &&
                session.subject === subject
              );
            })
            .reduce(
              (total, session) => total + session.durationSeconds,
              0,
            ) / 60,
        );
      }

      return row;
    });
  }, [sessions]);

  const monthData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const next = new Date(year, month, index + 2);

      const minutes = Math.round(
        sessions
          .filter((session) => {
            const started = new Date(session.startedAt);
            return started >= date && started < next;
          })
          .reduce((total, session) => total + session.durationSeconds, 0) / 60,
      );

      return {
        day: index + 1,
        minutes,
      };
    });
  }, [sessions]);

  const monthTotal = monthData.reduce(
    (total, day) => total + day.minutes,
    0,
  );

  const monthAverage = Math.round(
    monthTotal / Math.max(new Date().getDate(), 1),
  );

  const subjects = [...new Set(sessions.map((session) => session.subject))];

  return (
    <section className="rounded-[24px] border border-[#DDE2DE] bg-white p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#B99A5B]">
            FOCUS ANALYTICS
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-[#12352B]">
            Understand your work.
          </h2>
        </div>

        <div className="flex rounded-xl bg-[#F0F2EF] p-1">
          {(["today", "week", "month"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize ${
                view === item
                  ? "bg-white text-[#12352B] shadow-sm"
                  : "text-[#89918C]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {view === "today" && (
        <div className="mt-8 grid gap-8 md:grid-cols-[280px_1fr] md:items-center">
          <div className="relative h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={todayBySubject}
                  dataKey="minutes"
                  nameKey="subject"
                  innerRadius={72}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {todayBySubject.map((entry, index) => (
                    <Cell
                      key={entry.subject}
                      fill={subjectColors[index % subjectColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-semibold text-[#12352B]">
                {formatMinutes(todayTotal)}
              </p>
              <p className="text-xs text-[#89918C]">today</p>
            </div>
          </div>

          <div>
            {todayBySubject.length ? (
              <div className="space-y-4">
                {todayBySubject.map((item, index) => (
                  <div
                    key={item.subject}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            subjectColors[index % subjectColors.length],
                        }}
                      />
                      <span className="truncate text-sm text-[#17211C]">
                        {item.subject}
                      </span>
                    </div>

                    <span className="text-sm font-medium text-[#5E6963]">
                      {item.minutes} min
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5E6963]">
                Complete a focus session to see your subject breakdown.
              </p>
            )}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="mt-8">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={weekData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                {subjects.map((subject, index) => (
                  <Bar
                    key={subject}
                    dataKey={subject}
                    stackId="focus"
                    fill={subjectColors[index % subjectColors.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="mt-8">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="minutes"
                  fill="#12352B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 text-center">
            <p className="text-3xl font-semibold text-[#12352B]">
              {monthTotal} min total
            </p>
            <p className="mt-1 text-sm text-[#5E6963]">
              Average: {monthAverage} min/day
            </p>
          </div>
        </div>
      )}
    </section>
  );
}