"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
    });

    return unsubscribe;
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#17211C]">
      <nav className="border-b border-[#DDE2DE] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-xl font-semibold tracking-[0.18em] text-[#12352B]">
              AEVOR
            </div>

            <div className="mt-1 text-[9px] tracking-[0.28em] text-[#6B746F]">
              PURPOSE OVER NOISE.
            </div>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#12352B] transition hover:bg-[#E9EEEA]"
          >
            Sign out
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-[#B99A5B]">WELCOME BACK</p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
          What matters today?
        </h1>

        <p className="mt-4 text-[#5E6963]">
          {user.displayName || user.email}
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
            <p className="text-sm text-[#89918C]">Today</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#12352B]">
              No missions yet
            </h2>
            <p className="mt-2 text-sm text-[#5E6963]">
              Your daily execution space will live here.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
            <p className="text-sm text-[#89918C]">Progress</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#12352B]">
              0%
            </h2>
            <p className="mt-2 text-sm text-[#5E6963]">
              Progress will come from meaningful work.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE2DE] bg-white p-6">
            <p className="text-sm text-[#89918C]">Streak</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#12352B]">
              0 days
            </h2>
            <p className="mt-2 text-sm text-[#5E6963]">
              Start building consistency.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}