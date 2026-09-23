"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#17211C]">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div>
          <div className="text-xl font-semibold tracking-[0.18em] text-[#12352B]">
            AEVOR
          </div>

          <div className="mt-1 text-[9px] tracking-[0.28em] text-[#6B746F]">
            PURPOSE OVER NOISE.
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden max-w-[220px] truncate text-sm text-[#5E6963] sm:block">
                {user.displayName || user.email}
              </span>

              <button
                onClick={() => signOut(auth)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#12352B] transition hover:bg-[#E9EEEA]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#12352B] transition hover:bg-[#E9EEEA]"
              >
                Sign in
              </a>

              <a
                href="/login"
                className="rounded-xl bg-[#12352B] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0B211A]"
              >
                Get started
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 py-20 lg:px-10">
        <div className="max-w-4xl">
          <div className="mb-8 inline-flex items-center rounded-full border border-[#DDE2DE] bg-white px-4 py-2 text-xs tracking-[0.16em] text-[#5E6963]">
            BUILD WITH PURPOSE
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-7xl">
            Turn ambition into
            <span className="block text-[#12352B]">
              measurable progress.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#5E6963] md:text-xl">
            Aevor helps you turn long-term goals into purposeful daily action,
            track the work you actually do, and build a visible record of
            progress.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={user ? "/home" : "/login"}
              className="rounded-xl bg-[#12352B] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0B211A]"
            >
              {user ? "Continue with Aevor" : "Start with Aevor"}
            </a>

            <a
              href="#how-it-works"
              className="rounded-xl border border-[#C8D0CA] bg-white px-7 py-3.5 text-sm font-semibold text-[#12352B] transition hover:bg-[#F0F2EF]"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Core philosophy */}
      <section
        id="how-it-works"
        className="border-y border-[#DDE2DE] bg-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
              THE AEVOR LOOP
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              Purpose → Progress
            </h2>

            <p className="mt-4 leading-7 text-[#5E6963]">
              Aevor connects what you want to achieve with the work you do
              every day.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Define", "Purpose and long-term direction."],
              ["02", "Plan", "Goals, milestones and missions."],
              ["03", "Execute", "Focus, activity and real work."],
              ["04", "Prove", "Evidence, reflection and progress."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-2xl border border-[#DDE2DE] bg-[#F7F7F3] p-6"
              >
                <div className="text-sm text-[#B99A5B]">{number}</div>

                <h3 className="mt-8 text-xl font-semibold text-[#12352B]">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#5E6963]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
        <p className="text-sm tracking-[0.18em] text-[#B99A5B]">
          PURPOSE OVER NOISE.
        </p>

        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
          Do the work. Keep the proof.
        </h2>

        <p className="mx-auto mt-5 max-w-xl leading-7 text-[#5E6963]">
          Aevor is built for people who care more about meaningful progress
          than constant noise.
        </p>

        <a
          href={user ? "/home" : "/login"}
          className="mt-8 inline-block rounded-xl bg-[#12352B] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0B211A]"
        >
          {user ? "Enter Aevor" : "Enter Aevor"}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DDE2DE] px-6 py-8 text-center text-xs text-[#89918C]">
        © {new Date().getFullYear()} AEVOR
      </footer>
    </main>
  );
}