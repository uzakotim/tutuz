"use client";

import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { generateDailyExercises } from "@/lib/ai";

import {
  EXERCISE_ICONS,
  EXERCISE_LABELS,
  EXERCISE_TYPES,
  LEVELS,
} from "@/lib/types";
import { IoIosArrowDown } from "react-icons/io";


export function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const profile = useQuery(api.users.currentProfile);
  const todayData = useQuery(api.exercises.getTodaySession);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const updateLevel = useMutation(api.users.updateLevel);
  const createDailySession = useMutation(api.exercises.createDailySession);
  const changePassword = useAction(api.account.changePassword);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && profile === null) {
      void ensureProfile({});
    }
  }, [isAuthenticated, profile, ensureProfile]);

  async function handleGenerateExercises() {
    if (!profile) return;
    setGenerating(true);
    setError(null);

    try {
      const exerciseSet = await generateDailyExercises(profile.currentLevel);
      await createDailySession({
        level: profile.currentLevel,
        exercises: exerciseSet.exercises.map((e) => ({
          type: e.type,
          title: e.title,
          instructions: e.instructions,
          content: e.content,
        })),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate exercises",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordMessage("Password updated successfully.");
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (authLoading || profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const exercises = (todayData?.exercises ?? []).filter((exercise) => exercise.type !== "speaking");
  const session = todayData?.session;
  const completedCount = exercises.filter((e) => e.status === "completed").length;
  const totalXp = profile.totalXp;
  const maxSkillXp = Math.max(...Object.values(profile.skillXp), 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50">
      <header className="border-b border-teal-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇺🇿</span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Tutuz</h1>
              <p className="text-xs text-slate-500">Daily Uzbek practice</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button type="button" onClick={() => setProfileMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">{(profile.name ?? profile.email ?? "U").slice(0, 1).toUpperCase()}</span>
                <span className="hidden sm:inline">{profile.name ?? profile.email}</span>
                <span className="text-slate-400"><IoIosArrowDown /></span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  <button type="button" onClick={() => void signOut().then(() => router.push("/"))} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total XP" value={totalXp.toString()} accent="teal" />
          <StatCard
            label="Day streak"
            value={profile.streakDays.toString()}
            accent="amber"
          />
          <StatCard
            label="Today's progress"
            value={`${completedCount}/${EXERCISE_TYPES.length}`}
            accent="blue"
          />
          <StatCard
            label="Level"
            value={profile.currentLevel}
            accent="purple"
          />
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Your level
          </h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => void updateLevel({ level })}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${profile.currentLevel === level
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Skill progress
          </h2>
          <div className="space-y-3">
            {EXERCISE_TYPES.map((type) => (
              <div key={type}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {EXERCISE_ICONS[type]} {EXERCISE_LABELS[type]}
                  </span>
                  <span className="text-slate-500">{profile.skillXp[type]} XP</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{
                      width: `${Math.min(100, (profile.skillXp[type] / maxSkillXp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Today&apos;s exercises
              </h2>
              <p className="text-sm text-slate-500">
                {session
                  ? `${completedCount} of ${EXERCISE_TYPES.length} completed`
                  : "Generate your daily practice set"}
              </p>
            </div>
            {!session && (
              <button
                onClick={() => void handleGenerateExercises()}
                disabled={generating}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {generating ? "Generating..." : "Start today's lesson"}
              </button>
            )}
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {session ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXERCISE_TYPES.map((type) => {
                const exercise = exercises.find((e) => e.type === type);
                const done = exercise?.status === "completed";

                return (
                  <Link
                    key={type}
                    href={exercise ? `/exercise/${exercise._id}` : "#"}
                    className={`group rounded-xl border p-4 transition ${done
                      ? "border-teal-200 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-md"
                      } ${!exercise ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <div className="mb-2 text-2xl">{EXERCISE_ICONS[type]}</div>
                    <h3 className="font-semibold text-slate-900">
                      {EXERCISE_LABELS[type]}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {exercise?.title ?? "Not available"}
                    </p>
                    {done && exercise?.score !== undefined && (
                      <p className="mt-2 text-sm font-medium text-teal-700">
                        Score: {exercise.score}%
                      </p>
                    )}
                    {!done && exercise && (
                      <p className="mt-2 text-sm font-medium text-teal-600 group-hover:underline">
                        Start →
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">
                Click &quot;Start today&apos;s lesson&quot; to get 5 AI-generated
                exercises tailored to your {profile.currentLevel} level.
              </p>
            </div>
          )}
        </section>

        {passwordModalOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 px-4" role="dialog" aria-modal="true" aria-labelledby="password-title">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div><h2 id="password-title" className="text-xl font-semibold text-slate-900">Change password</h2><p className="mt-1 text-sm text-slate-500">Use at least 8 characters.</p></div>
                <button type="button" onClick={() => setPasswordModalOpen(false)} className="text-xl text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
              </div>
              <form onSubmit={(e) => void handlePasswordChange(e)} className="mt-5 space-y-3">
                <input type="password" required minLength={8} placeholder="Current password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500" />
                <input type="password" required minLength={8} placeholder="New password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500" />
                <input type="password" required minLength={8} placeholder="Confirm new password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500" />
                <div className="flex items-center gap-3 pt-2"><button type="submit" disabled={passwordSaving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{passwordSaving ? "Updating..." : "Update password"}</button><button type="button" onClick={() => setPasswordModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button></div>
                {passwordMessage && <p className="text-sm text-slate-600">{passwordMessage}</p>}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "teal" | "amber" | "blue" | "purple";
}) {
  const colors = {
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[accent]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
