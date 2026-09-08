"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { ExerciseView } from "@/components/exercises/ExerciseView";
import type { Id } from "@/convex/_generated/dataModel";

export default function ExercisePage({ params }: PageProps<"/exercise/[id]">) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const exerciseId = id as Id<"exercises">;
  const exercise = useQuery(api.exercises.getExercise, { exerciseId });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || exercise === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-slate-600">Exercise not found</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-teal-600 hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return <ExerciseView exercise={exercise} />;
}
