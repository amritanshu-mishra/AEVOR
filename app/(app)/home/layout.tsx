"use client";

import { useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import AppShell from "@/components/aevor/AppShell";

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setCheckingAuth(false);
      }
    });

    return unsubscribe;
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F3]">
        <p className="text-sm text-[#5E6963]">Loading Aevor...</p>
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}