"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  { icon: "📚", label: "Vocabulary", desc: "Build your word bank" },
  { icon: "🎧", label: "Listening", desc: "Train your ear" },
  { icon: "✏️", label: "Grammar", desc: "Master the rules" },
  { icon: "📖", label: "Reading", desc: "Read real Uzbek" },
  { icon: "✍️", label: "Writing", desc: "Express yourself" },
];

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, #7C3AED 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-48 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #FBBF24 0%, #F59E0B 100%)" }}
      />

      <main className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center">
        {/* Logo / icon area */}
        <div className="animate-float mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}>
          {/* Brain + Book emoji fallback */}
          <span className="text-5xl">🧠</span>
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          AI-powered Uzbek learning
        </div>

        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Learn{" "}
          <span
            className="gradient-text"
          >
            Uzbek
          </span>{" "}
          with Tutuz
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600">
          Daily AI-powered exercises in vocabulary, grammar, listening, reading,
          and writing — from A1 to B2.
        </p>

        {/* Feature cards */}
        <div className="mt-12 grid w-full max-w-2xl gap-3 sm:grid-cols-5">
          {features.map((item) => (
            <div
              key={item.label}
              className="group rounded-2xl border border-indigo-100 bg-white/80 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="text-3xl">{item.icon}</div>
              <p className="mt-2 text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth"
            className="group relative overflow-hidden rounded-xl px-9 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            <span className="relative z-10">Get started free</span>
            {/* Shimmer effect */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full"
            />
          </Link>
          <Link
            href="/auth"
            className="rounded-xl border-2 border-indigo-200 bg-white/80 px-9 py-3.5 font-semibold text-indigo-700 backdrop-blur transition duration-300 hover:border-indigo-400 hover:bg-white hover:-translate-y-0.5"
          >
            Sign in
          </Link>
        </div>

        {/* Social proof chip */}
        <p className="mt-8 text-sm text-slate-500">
          Free forever · No credit card required
        </p>
      </main>
    </div>
  );
}
