"use client";

import { FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      window.location.href = "/home";
    } catch {
      setError(
        mode === "login"
          ? "Unable to sign in. Check your email and password."
          : "Unable to create your account. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = "/";
    } catch {
      setError("Google sign-in could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F3] px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full">
          <div className="mb-10 text-center">
            <a
              href="/"
              className="text-2xl font-semibold tracking-[0.25em] text-[#12352B]"
            >
              AEVOR
            </a>

            <p className="mt-2 text-xs tracking-[0.25em] text-[#5E6963]">
              PURPOSE OVER NOISE.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE2DE] bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-[#17211C]">
                {mode === "login" ? "Welcome back." : "Create your account."}
              </h1>

              <p className="mt-2 text-sm text-[#5E6963]">
                {mode === "login"
                  ? "Continue building with purpose."
                  : "Start turning ambition into measurable progress."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full rounded-xl border border-[#C8D0CA] px-4 py-3 text-sm font-medium text-[#17211C] transition hover:bg-[#F0F2EF] disabled:opacity-60"
            >
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#DDE2DE]" />
              <span className="text-xs text-[#89918C]">OR</span>
              <div className="h-px flex-1 bg-[#DDE2DE]" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#17211C]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#12352B]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#17211C]">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-[#DDE2DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#12352B]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-[#FBEDEC] px-3 py-2 text-sm text-[#B94A48]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#12352B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0B211A] disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5E6963]">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() =>
                  setMode(mode === "login" ? "signup" : "login")
                }
                className="font-medium text-[#12352B] underline underline-offset-4"
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}