"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const navigation = [
  { name: "Home", href: "/home" },
  { name: "Execute", href: "/execute" },
  { name: "Goals", href: "/goals" },
  { name: "Community", href: "/community" },
  { name: "Profile", href: "/profile" },
];

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <div className="min-h-screen bg-[#F7F7F3] text-[#17211C]">
      <header className="border-b border-[#DDE2DE] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/home">
            <div className="text-xl font-semibold tracking-[0.18em] text-[#12352B]">
              AEVOR
            </div>
            <div className="mt-1 text-[9px] tracking-[0.28em] text-[#6B746F]">
              PURPOSE OVER NOISE.
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#12352B] transition hover:bg-[#E9EEEA]"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r border-[#DDE2DE] bg-white px-4 py-6 md:block">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#12352B] text-white"
                      : "text-[#5E6963] hover:bg-[#F0F2EF] hover:text-[#12352B]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="pb-24 md:pb-8">{children}</main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DDE2DE] bg-white md:hidden">
        <div className="grid grid-cols-5">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-4 text-center text-xs font-medium ${
                  active ? "text-[#12352B]" : "text-[#89918C]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}