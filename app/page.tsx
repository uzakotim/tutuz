"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50">
      <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center">
        <div className="mb-6 text-6xl">🇺🇿</div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Learn Uzbek with Tutuz
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Daily AI-powered exercises in vocabulary, grammar, listening, reading,
          and writing — from A1 to B2.
        </p>

        <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          {[
            { icon: "📚", label: "Vocabulary" },
            { icon: "🎧", label: "Listening" },
            { icon: "✏️", label: "Grammar" },
            { icon: "📖", label: "Reading" },
            { icon: "✍️", label: "Writing" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"
            >
              <div className="text-2xl">{item.icon}</div>
              <p className="mt-1 font-medium text-slate-800">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth"
            className="rounded-xl bg-teal-600 px-8 py-3.5 font-semibold text-white transition hover:bg-teal-700"
          >
            Get started free
          </Link>
          <Link
            href="/auth"
            className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
