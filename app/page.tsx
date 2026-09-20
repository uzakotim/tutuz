"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  {
    label: "Vocabulary",
    desc: "Build your word bank through smart repetition",
    color: "indigo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    label: "Listening",
    desc: "Train your ear with real Uzbek audio",
    color: "sky",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
  {
    label: "Grammar",
    desc: "Master Uzbek grammar rules with context",
    color: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    label: "Reading",
    desc: "Read authentic texts with comprehension checks",
    color: "emerald",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Writing",
    desc: "Express yourself in Uzbek, AI-evaluated",
    color: "amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
];

const colorMap: Record<string, { icon: string; border: string; bg: string; text: string }> = {
  indigo: { icon: "text-indigo-600", border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-700" },
  sky: { icon: "text-sky-600", border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700" },
  violet: { icon: "text-violet-600", border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700" },
  emerald: { icon: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { icon: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
};

export default function HomePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-grid">
      {/* Decorative orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-[0.15] blur-[80px] animate-drift"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, #7C3AED 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-56 h-[500px] w-[500px] rounded-full opacity-[0.12] blur-[70px] animate-drift"
        style={{ background: "radial-gradient(circle, #FBBF24 0%, #F59E0B 100%)", animationDelay: "2s" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-[0.08] blur-[60px]"
        style={{ background: "radial-gradient(circle, #0EA5E9 0%, #38BDF8 100%)" }}
      />

      <main className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
        {/* Logo + badge row */}
        <div className="animate-slide-up flex flex-col items-center gap-5">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-40 animate-pulse-glow"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
            />
            <img src="/icon.png" alt="Tutuz" className="relative h-16 w-16 rounded-2xl shadow-lg" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm shadow-indigo-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            AI-powered · A1 to B2 · Free forever
          </div>
        </div>

        {/* Headline */}
        <div className="mt-8 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.08]">
            Learn{" "}
            <span className="gradient-text">Uzbek</span>
            <br />
            the smart way
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-lg text-slate-500 leading-relaxed">
            Daily AI-generated exercises across five skills — personalized to
            your level and designed to stick.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row animate-slide-up" style={{ animationDelay: "160ms" }}>
          <Link
            href="/auth"
            id="cta-get-started"
            className="group relative overflow-hidden rounded-2xl px-10 py-4 font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 focus-ring"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            <span className="relative z-10 text-[15px]">Get started — it&apos;s free</span>
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full"
            />
          </Link>
          <Link
            href="/auth"
            id="cta-sign-in"
            className="rounded-2xl border border-slate-200 bg-white/80 px-10 py-4 text-[15px] font-semibold text-slate-700 transition duration-200 hover:border-indigo-300 hover:bg-white hover:text-indigo-700 hover:-translate-y-0.5 focus-ring"
          >
            Sign in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid w-full max-w-2xl gap-3 sm:grid-cols-5 stagger-children" style={{ "--stagger-delay": "200ms" } as React.CSSProperties}>
          {features.map((item) => {
            const c = colorMap[item.color];
            return (
              <div
                key={item.label}
                className={`group rounded-2xl border ${c.border} ${c.bg} p-4 shadow-sm transition duration-300 card-hover`}
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${c.icon}`}>
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Trust line */}
        <p className="mt-10 text-sm text-slate-400 animate-fade-in" style={{ animationDelay: "600ms" }}>
          Built with ❤️ for Uzbek learners
        </p>
      </main>
    </div>
  );
}
