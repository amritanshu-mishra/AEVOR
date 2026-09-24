"use client";

import Link from "next/link";

export default function ExecutePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
          EXECUTE
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
          Do the work.
        </h1>

        <p className="mt-4 text-[#5E6963]">
          Turn today&apos;s intention into meaningful action.
        </p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
                TODAY&apos;S MISSIONS
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#12352B]">
                Nothing planned yet.
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#5E6963]">
                Create a mission and give today a clear direction.
              </p>
            </div>

            <button className="rounded-xl bg-[#12352B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B211A]">
              + Mission
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
            FOCUS
          </p>

          <div className="mt-6 text-center">
            <p className="text-5xl font-semibold tracking-[-0.04em] text-[#12352B]">
              00:00:00
            </p>

            <p className="mt-3 text-sm text-[#5E6963]">
              Ready when you are.
            </p>

            <button className="mt-6 w-full rounded-xl bg-[#12352B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B211A]">
              Start Focus
            </button>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#DDE2DE] bg-white p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#89918C]">
              RECENT ACTIVITY
            </p>

            <h2 className="mt-3 text-xl font-semibold text-[#12352B]">
              No activity yet.
            </h2>

            <p className="mt-2 text-sm text-[#5E6963]">
              Completed work will appear here.
            </p>
          </div>

          <Link
            href="/home"
            className="hidden rounded-xl border border-[#C8D0CA] px-4 py-2.5 text-sm font-medium text-[#12352B] hover:bg-[#F0F2EF] sm:block"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </section>
  );
}