"use client";

import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { generateDailyExercises } from "@/lib/ai";
import type { Id } from "@/convex/_generated/dataModel";

import {
  EXERCISE_ICONS,
  EXERCISE_LABELS,
  EXERCISE_TYPES,
  LEVELS,
  type Topic,
} from "@/lib/types";
import { IoIosArrowDown } from "react-icons/io";


export function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useQuery(api.users.currentProfile);
  const todayData = useQuery(api.exercises.getTodaySession);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const updateLevel = useMutation(api.users.updateLevel);
  const createDailySession = useMutation(api.exercises.createDailySession);
  const ensureCurriculumSeeded = useMutation(api.topics.ensureCurriculumSeeded);
  const changePassword = useAction(api.account.changePassword);
  const requestedTopicId = searchParams.get("topicId") as Id<"topics"> | null;
  const requestedTopic = useQuery(
    api.topics.getTopic,
    requestedTopicId && isAuthenticated ? { topicId: requestedTopicId } : "skip",
  );
  const levelProgress = useQuery(api.topics.getUserLevelProgress, isAuthenticated ? {} : "skip");
  const curriculumTopics = useQuery(
    api.topics.getTopicsByLevel,
    profile ? { level: profile.currentLevel } : "skip",
  );

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [curriculumReady, setCurriculumReady] = useState(false);
  const [topicCategory, setTopicCategory] = useState("All");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const generatedFromQuery = useRef<string | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function seedCurriculum() {
      try {
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const result = await ensureCurriculumSeeded({});
          if (!result.hasMore) break;
        }
        if (!cancelled) setCurriculumReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the curriculum");
        }
      }
    }

    void seedCurriculum();
    return () => { cancelled = true; };
  }, [isAuthenticated, ensureCurriculumSeeded]);

  const handleGenerateExercises = useCallback(async (topic?: Topic) => {
    if (!profile) return; setGenerating(true); setError(null); try {
      const lessonLevel = topic?.level ?? profile.currentLevel;
      const exerciseSet = await generateDailyExercises(lessonLevel, topic);
      const session = await createDailySession({
        level: lessonLevel,
        topicId: topic?._id as Id<"topics"> | undefined,
        exercises: exerciseSet.exercises.map((e) => ({
          type: e.type,
          title: e.title,
          instructions: e.instructions,
          content: e.content,
        })),
      });
      const firstExerciseId = session.exerciseIds[0];
      if (firstExerciseId) {
        // Give Convex's reactive query a moment to receive the updated 
        // daily session before leaving the dashboard. 
        await new Promise((resolve) => setTimeout(resolve, 150));
        router.push(`/exercise/${firstExerciseId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate exercises",);
    } finally { setGenerating(false); }
  }, [profile, router, createDailySession]);

  useEffect(() => {
    if (
      !requestedTopic ||
      !profile ||
      !curriculumReady ||
      generatedFromQuery.current === requestedTopic._id
    ) return;
    generatedFromQuery.current = requestedTopic._id;
    void handleGenerateExercises(requestedTopic as Topic).finally(() => {
      router.replace("/dashboard");
    });
  }, [requestedTopic, profile, curriculumReady, router, handleGenerateExercises]);

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
  const currentLevelProgress = levelProgress?.levels.find((item) => item.level === profile.currentLevel);
  const nextTopic = currentLevelProgress?.nextTopic ?? null;
  const categories = ["All", ...Array.from(new Set((curriculumTopics ?? []).map((item) => item.topic.category)))];
  const filteredTopics = (curriculumTopics ?? []).filter((item) => topicCategory === "All" || item.topic.category === topicCategory);

  const inputCls =
    "w-full rounded-xl border border-indigo-100 bg-white/70 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Icon" className="h-12 w-12 rounded-xl" />

            <div>
              <h1 className="text-base font-bold text-slate-900">Tutuz</h1>
              <p className="text-xs text-slate-500">Daily Uzbek practice</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-white"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                >
                  {(profile.name ?? profile.email ?? "U").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{profile.name ?? profile.email}</span>
                <span className="text-slate-400"><IoIosArrowDown /></span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl shadow-slate-200/60">
                  <button
                    type="button"
                    onClick={() => void signOut().then(() => router.push("/"))}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Stats row */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total XP" value={totalXp.toString()} accent="indigo" icon="⚡" />
          <StatCard
            label="Day streak"
            value={profile.streakDays.toString()}
            accent="amber"
            icon="🔥"
          />
          <StatCard
            label="Today's progress"
            value={`${completedCount}/${EXERCISE_TYPES.length}`}
            accent="blue"
            icon="📈"
          />
          <StatCard
            label="Level"
            value={profile.currentLevel}
            accent="violet"
            icon="🎯"
          />
        </section>

        {/* Level selector */}
        <section className="mb-8 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Your level</h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => void updateLevel({ level })}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition duration-200 ${profile.currentLevel === level
                  ? "text-white shadow-md shadow-indigo-500/20"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                style={
                  profile.currentLevel === level
                    ? { background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }
                    : undefined
                }
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        {/* Level progress */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-indigo-600">Level progress</p>
              <h2 className="text-xl font-bold text-slate-900">
                Level {profile.currentLevel}: {currentLevelProgress?.completedTopics ?? 0} of {currentLevelProgress?.totalTopics ?? 0} topics
              </h2>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{currentLevelProgress?.percentage ?? 0}%</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-indigo-50">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${currentLevelProgress?.percentage ?? 0}%`,
                background: "linear-gradient(90deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)",
              }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {levelProgress?.levels.map((item) => (
              <div
                key={item.level}
                className={`rounded-xl border p-3 transition ${item.level === profile.currentLevel
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-100 bg-slate-50/80"
                  }`}
              >
                <div className="flex justify-between text-sm font-semibold">
                  <span>{item.level}</span>
                  <span className={item.level === profile.currentLevel ? "text-indigo-600" : "text-slate-500"}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      background: item.level === profile.currentLevel
                        ? "linear-gradient(90deg, #4F46E5, #7C3AED)"
                        : "#94A3B8",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.completedTopics}/{item.totalTopics} topics</p>
              </div>
            ))}
          </div>
        </section>

        {/* Up next */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-amber-500">✨</span>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Up next</p>
          </div>
          {nextTopic ? (
            <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm text-slate-500">Topic {nextTopic.order} · {nextTopic.category}</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{nextTopic.title}</h2>
                <p className="mt-1 text-lg font-medium text-indigo-700">{nextTopic.titleUzbek}</p>
                <p className="mt-3 text-slate-600">{nextTopic.description}</p>
                <p className="mt-3 text-sm text-slate-500">
                  Vocabulary: {nextTopic.keyVocabulary.slice(0, 4).map((word) => word.uzbek).join(", ")}
                </p>
              </div>
              <button
                onClick={() => void handleGenerateExercises(nextTopic as Topic)}
                disabled={generating || !curriculumReady}
                className="group relative shrink-0 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:transform-none"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)" }}
              >
                <span className="relative z-10">{generating ? "Generating..." : "Generate lesson for this topic"}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full"
                />
              </button>
            </div>
          ) : (
            <p className="mt-2 text-slate-600">
              {curriculumReady
                ? "You have completed this level — choose the next CEFR level to continue."
                : "Preparing your curriculum..."}
            </p>
          )}
        </section>

        {/* Curriculum explorer */}
        <section className="mb-8 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Curriculum explorer</h2>
              <p className="text-sm text-slate-500">Choose a topic for a focused lesson.</p>
            </div>
            <select
              value={topicCategory}
              onChange={(event) => setTopicCategory(event.target.value)}
              className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {filteredTopics.map(({ topic, status, lastScore }) => {
              const expanded = selectedTopicId === topic._id;
              const statusStyle =
                status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : status === "in_progress"
                    ? "bg-amber-100 text-amber-800"
                    : topic._id === nextTopic?._id
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-100 text-slate-600";
              const label =
                status === "completed"
                  ? "Completed"
                  : status === "in_progress"
                    ? "In progress"
                    : topic._id === nextTopic?._id
                      ? "Up next"
                      : "Available";
              return (
                <div key={topic._id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-indigo-100 hover:bg-indigo-50/40">
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId(expanded ? null : topic._id ?? null)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="w-7 text-center text-sm font-bold text-slate-400">{topic.order}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{topic.title}</span>
                      <span className="block truncate text-sm text-slate-500">{topic.titleUzbek} · {topic.category}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
                      {label}{lastScore !== null ? ` · ${lastScore}%` : ""}
                    </span>
                  </button>
                  {expanded && (
                    <div className="ml-10 mt-3 border-t border-slate-200 pt-3">
                      <p className="text-sm text-slate-600">{topic.description}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        <span className="font-medium">Grammar:</span> {topic.grammarFocus}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        <span className="font-medium">Vocabulary:</span>{" "}
                        {topic.keyVocabulary.map((word) => `${word.uzbek} (${word.english})`).join(", ")}
                      </p>
                      <button
                        onClick={() => void handleGenerateExercises(topic as Topic)}
                        disabled={generating || !curriculumReady || status === "completed"}
                        className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                      >
                        {status === "completed" ? "Topic completed" : "Generate focused lesson"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Skill progress */}
        <section className="mb-8 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Skill progress</h2>
          <div className="space-y-4">
            {EXERCISE_TYPES.map((type) => (
              <div key={type}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {EXERCISE_ICONS[type]} {EXERCISE_LABELS[type]}
                  </span>
                  <span className="text-indigo-600 font-semibold">{profile.skillXp[type]} XP</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-indigo-50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (profile.skillXp[type] / maxSkillXp) * 100)}%`,
                      background: "linear-gradient(90deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Today's exercises */}
        <section className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Today&apos;s exercises</h2>
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
                className="group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
                style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
              >
                <span className="relative z-10">{generating ? "Generating..." : "Start today's lesson"}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full"
                />
              </button>
            )}
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
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
                    className={`group rounded-2xl border p-4 transition duration-200 ${done
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
                      } ${!exercise ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <div className="mb-2 text-2xl">{EXERCISE_ICONS[type]}</div>
                    <h3 className="font-semibold text-slate-900">{EXERCISE_LABELS[type]}</h3>
                    <p className="mt-1 text-sm text-slate-500">{exercise?.title ?? "Not available"}</p>
                    {done && exercise?.score !== undefined && (
                      <p className="mt-2 text-sm font-semibold text-indigo-600">Score: {exercise.score}%</p>
                    )}
                    {!done && exercise && (
                      <p className="mt-2 text-sm font-semibold text-indigo-500 group-hover:text-indigo-700">
                        Start →
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center">
              <p className="text-slate-500">
                Click &quot;Start today&apos;s lesson&quot; to get 5 AI-generated
                exercises tailored to your {profile.currentLevel} level.
              </p>
            </div>
          )}
        </section>

        {/* Password change modal */}
        {passwordModalOpen && (
          <div
            className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="password-title" className="text-xl font-semibold text-slate-900">Change password</h2>
                  <p className="mt-1 text-sm text-slate-500">Use at least 8 characters.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="text-xl text-slate-400 hover:text-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={(e) => void handlePasswordChange(e)} className="mt-5 space-y-3">
                <input type="password" required minLength={8} placeholder="Current password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} className={inputCls} />
                <input type="password" required minLength={8} placeholder="New password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} className={inputCls} />
                <input type="password" required minLength={8} placeholder="Confirm new password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} />
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                  >
                    {passwordSaving ? "Updating..." : "Update password"}
                  </button>
                  <button type="button" onClick={() => setPasswordModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
                    Cancel
                  </button>
                </div>
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
  icon,
}: {
  label: string;
  value: string;
  accent: "indigo" | "amber" | "blue" | "violet";
  icon: string;
}) {
  const styles: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    indigo: {
      bg: "bg-indigo-50/80",
      text: "text-indigo-700",
      border: "border-indigo-100",
      iconBg: "bg-indigo-100",
    },
    amber: {
      bg: "bg-amber-50/80",
      text: "text-amber-700",
      border: "border-amber-100",
      iconBg: "bg-amber-100",
    },
    blue: {
      bg: "bg-blue-50/80",
      text: "text-blue-700",
      border: "border-blue-100",
      iconBg: "bg-blue-100",
    },
    violet: {
      bg: "bg-violet-50/80",
      text: "text-violet-700",
      border: "border-violet-100",
      iconBg: "bg-violet-100",
    },
  };

  const s = styles[accent];

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-5 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${s.text} opacity-80`}>{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg} text-base`}>{icon}</span>
      </div>
      <p className={`mt-2 text-3xl font-bold ${s.text}`}>{value}</p>
    </div>
  );
}
