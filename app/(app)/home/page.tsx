"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type AuthUser = {
  uid: string;
  email: string | null;
};

export default function HomePage() {
  const [apiUser, setApiUser] = useState<AuthUser | null>(null);

  useEffect(() => {
  apiFetch("/api/v1/auth/sync", {
    method: "POST",
  })
    .then((res) => {
      if (!res.ok) throw new Error("User sync failed");
      return res.json();
    })
    .then(setApiUser)
    .catch(console.error);
}, []);

  const name =
    apiUser?.email?.split("@")[0] ||
    "there";

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <p className="text-xs font-semibold tracking-[0.2em] text-[#B99A5B]">
        WELCOME BACK
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
        What matters today, {name}?
      </h1>

      <p className="mt-4 text-[#5E6963]">
        Focus on the work that moves your goals forward.
      </p>

      <div className="mt-10 rounded-2xl border border-[#DDE2DE] bg-white p-6">
        <p className="text-sm text-[#89918C]">Authentication</p>
        <p className="mt-2 font-medium text-[#12352B]">
          {apiUser ? "Connected to Aevor backend" : "Connecting..."}
        </p>
      </div>
    </section>
  );
}