"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

type AuthMode = "signIn" | "signUp" | "forgot" | "reset";

export function AuthForm() {
  const { signIn } = useAuthActions();
  const ensureProfile = useMutation(api.users.ensureProfile);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetCode = searchParams.get("code");

  const [mode, setMode] = useState<AuthMode>(() => resetCode ? "reset" : "signIn");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        await signIn("password", {
          flow: "reset",
          email,
          redirectTo: `/auth?email=${encodeURIComponent(email)}`,
        });
        setMessage("If an account exists for that email, a reset link is on its way.");
        setLoading(false);
        return;
      }

      if (mode === "reset") {
        if (!resetCode) throw new Error("This reset link is missing its code");
        await signIn("password", {
          flow: "reset-verification",
          email,
          code: resetCode,
          newPassword: password,
        });
        router.push("/dashboard");
        return;
      }

      await signIn("password", {
        flow: mode === "signUp" ? "signUp" : "signIn",
        email,
        password,
        ...(mode === "signUp" && name ? { name } : {}),
      });

      if (mode === "signUp") {
        await ensureProfile({ displayName: name || undefined });
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "signUp"
            ? "Could not create account"
            : "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-teal-100 bg-white p-8 shadow-lg shadow-teal-900/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-2xl text-white">
            🇺🇿
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tutuz</h1>
          <p className="mt-1 text-sm text-slate-500">
            Learn Uzbek from A1 to B2
          </p>
        </div>

        {mode !== "forgot" && mode !== "reset" && <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("signIn")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "signIn"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signUp")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "signUp"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign up
          </button>
        </div>}

        {(mode === "forgot" || mode === "reset") && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "forgot" ? "Reset your password" : "Choose a new password"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "forgot"
                ? "Enter your email and we’ll send you a secure reset link."
                : "Your new password must be at least 8 characters."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="At least 8 characters"
            />
          </div>}

          {mode === "signIn" && (
            <button type="button" onClick={() => setMode("forgot")} className="text-sm text-teal-700 hover:underline">
              Forgot your password?
            </button>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "signUp" ? "Create account" : mode === "forgot" ? "Email reset link" : mode === "reset" ? "Set new password" : "Sign in"}
          </button>
        </form>

        {(mode === "forgot" || mode === "reset") && (
          <button type="button" onClick={() => setMode("signIn")} className="mt-5 w-full text-sm text-slate-500 hover:text-slate-800">
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
