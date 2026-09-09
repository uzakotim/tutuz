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

  const inputCls =
    "w-full rounded-xl border border-indigo-100 bg-white/70 px-4 py-2.5 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-indigo-900/10 backdrop-blur">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/icon.png" alt="Icon" className="h-12 w-12 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tutuz</h1>
          <p className="mt-1 text-sm text-slate-500">
            Learn Uzbek from A1 to B2
          </p>
        </div>

        {/* Tab switcher */}
        {mode !== "forgot" && mode !== "reset" && (
          <div className="mb-6 flex rounded-xl bg-indigo-50 p-1">
            <button
              type="button"
              onClick={() => setMode("signIn")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${mode === "signIn"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signUp")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${mode === "signUp"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Sign up
            </button>
          </div>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "forgot" ? "Reset your password" : "Choose a new password"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "forgot"
                ? "Enter your email and we'll send you a secure reset link."
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
                className={inputCls}
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
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="At least 8 characters"
              />
            </div>
          )}

          {mode === "signIn" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Forgot your password?
            </button>
          )}

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            <span className="relative z-10">
              {loading
                ? "Please wait..."
                : mode === "signUp"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Email reset link"
                    : mode === "reset"
                      ? "Set new password"
                      : "Sign in"}
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full"
            />
          </button>
        </form>

        {(mode === "forgot" || mode === "reset") && (
          <button
            type="button"
            onClick={() => setMode("signIn")}
            className="mt-5 w-full text-sm text-slate-500 hover:text-slate-800"
          >
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
