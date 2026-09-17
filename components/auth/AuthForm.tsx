"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

type AuthMode = "signIn" | "signUp" | "forgot" | "reset";

function EmailIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="dot-spinner inline-flex items-center gap-1">
      <span />
      <span />
      <span />
    </span>
  );
}

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

  const inputWrapCls = "relative";
  const inputIconCls = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white";

  const submitLabel = loading ? <LoadingDots /> : (
    mode === "signUp" ? "Create account" :
    mode === "forgot" ? "Send reset link" :
    mode === "reset" ? "Set new password" :
    "Sign in"
  );

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="glass-elevated rounded-3xl p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div
              className="absolute inset-0 rounded-2xl blur-lg opacity-40"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
            />
            <img src="/icon.png" alt="Tutuz" className="relative h-14 w-14 rounded-2xl shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tutuz</h1>
          <p className="mt-1 text-sm text-slate-500">Learn Uzbek from A1 to B2</p>
        </div>

        {/* Tab switcher */}
        {mode !== "forgot" && mode !== "reset" && (
          <div className="mb-6 flex rounded-2xl bg-slate-100/80 p-1">
            {(["signIn", "signUp"] as const).map((m) => (
              <button
                key={m}
                type="button"
                id={`tab-${m}`}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {m === "signIn" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <div className="mb-6 animate-slide-down">
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
            <div className="animate-slide-down">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </label>
              <div className={inputWrapCls}>
                <span className={inputIconCls}><UserIcon /></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <div className={inputWrapCls}>
              <span className={inputIconCls}><EmailIcon /></span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </label>
              <div className={inputWrapCls}>
                <span className={inputIconCls}><LockIcon /></span>
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
            </div>
          )}

          {mode === "signIn" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 animate-slide-down">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 animate-slide-down">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-indigo-800">{message}</p>
            </div>
          )}

          <button
            type="submit"
            id="auth-submit"
            disabled={loading}
            className="group relative mt-1 w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition duration-300 hover:shadow-xl hover:shadow-indigo-500/35 hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none focus-ring"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {submitLabel}
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
            className="mt-5 flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
