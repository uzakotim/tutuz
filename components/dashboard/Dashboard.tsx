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

// ─── Skill color config ────────────────────────────────────────────────────────
type SkillColor = {
  border: string;
  bg: string;
  text: string;
  topBar: string;
  badge: string;
  badgeText: string;
};

const SKILL_COLORS: Record<string, SkillColor> = {
  vocabulary: {
    border: "border-indigo-200",
    bg: "bg-indigo-50/60",
    text: "text-indigo-700",
    topBar: "bg-indigo-500",
    badge: "bg-indigo-100",
    badgeText: "text-indigo-800",
  },
  grammar: {
    border: "border-violet-200",
    bg: "bg-violet-50/60",
    text: "text-violet-700",
    topBar: "bg-violet-500",
    badge: "bg-violet-100",
    badgeText: "text-violet-800",
  },
  listening: {
    border: "border-sky-200",
    bg: "bg-sky-50/60",
    text: "text-sky-700",
    topBar: "bg-sky-500",
    badge: "bg-sky-100",
    badgeText: "text-sky-800",
  },
  reading: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/60",
    text: "text-emerald-700",
    topBar: "bg-emerald-500",
    badge: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  writing: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    text: "text-amber-700",
    topBar: "bg-amber-500",
    badge: "bg-amber-100",
    badgeText: "text-amber-800",
  },
};

// ─── SVG icons ────────────────────────────────────────────────────────────────
function XpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
function StreakIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
    </svg>
  );
}
function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
function LevelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  );
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25-2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
    </svg>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
type StatAccent = "indigo" | "amber" | "blue" | "violet";

const STAT_STYLES: Record<StatAccent, { bg: string; border: string; text: string; iconBg: string; iconText: string }> = {
  indigo: { bg: "bg-indigo-50/80", border: "border-indigo-100", text: "text-indigo-700", iconBg: "bg-indigo-100", iconText: "text-indigo-600" },
  amber: { bg: "bg-amber-50/80", border: "border-amber-100", text: "text-amber-700", iconBg: "bg-amber-100", iconText: "text-amber-600" },
  blue: { bg: "bg-blue-50/80", border: "border-blue-100", text: "text-blue-700", iconBg: "bg-blue-100", iconText: "text-blue-600" },
  violet: { bg: "bg-violet-50/80", border: "border-violet-100", text: "text-violet-700", iconBg: "bg-violet-100", iconText: "text-violet-600" },
};

function StatCard({ label, value, accent, icon }: {
  label: string;
  value: string;
  accent: StatAccent;
  icon: React.ReactNode;
}) {
  const s = STAT_STYLES[accent];
  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-5 transition duration-200 card-hover`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${s.text} opacity-70`}>{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.iconBg} ${s.iconText}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${s.text}`}>{value}</p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
        await new Promise((resolve) => setTimeout(resolve, 150));
        router.push(`/exercise/${firstExerciseId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate exercises");
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

  // ─── Loading state ────────────────────────────────────────────────────────
  if (authLoading || profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }
  if (!profile) return null;

  // ─── Derived state ────────────────────────────────────────────────────────
  const exercises = (todayData?.exercises ?? []).filter((exercise) => exercise.type !== "speaking");
  const session = todayData?.session;
  const completedCount = exercises.filter((e) => e.status === "completed").length;
  const totalXp = profile.totalXp;
  const maxSkillXp = Math.max(...Object.values(profile.skillXp), 1);
  const currentLevelProgress = levelProgress?.levels.find((item) => item.level === profile.currentLevel);
  const nextTopic = currentLevelProgress?.nextTopic ?? null;
  const categories = ["All", ...Array.from(new Set((curriculumTopics ?? []).map((item) => item.topic.category)))];
  const filteredTopics = (curriculumTopics ?? []).filter((item) => topicCategory === "All" || item.topic.category === topicCategory);

  const modalInputCls =
    "w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white";

  const userInitial = (profile.name ?? profile.email ?? "U").slice(0, 1).toUpperCase();
  const userName = profile.name ?? profile.email ?? "";

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 glass-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Tutuz" className="h-9 w-9 rounded-xl" />
            <div>
              <span className="text-[15px] font-bold text-slate-900">Tutuz</span>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">Daily Uzbek practice</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak badge */}
            {profile.streakDays > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
                <StreakIcon className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">{profile.streakDays}</span>
              </div>
            )}

            {/* Profile menu */}
            <div className="relative">
              <button
                type="button"
                id="profile-menu-btn"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 pl-1.5 pr-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-white"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                >
                  {userInitial}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">{userName}</span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition duration-200 ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-48 animate-slide-down rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/60">
                  <button
                    type="button"
                    onClick={() => { setProfileMenuOpen(false); setPasswordModalOpen(true); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <LockIcon className="h-4 w-4 text-slate-400" />
                    Change password
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => void signOut().then(() => router.push("/"))}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <StatCard label="Total XP" value={totalXp.toString()} accent="indigo" icon={<XpIcon className="h-4 w-4" />} />
          <StatCard label="Day streak" value={profile.streakDays.toString()} accent="amber" icon={<StreakIcon className="h-4 w-4" />} />
          <StatCard label="Today" value={`${completedCount}/${EXERCISE_TYPES.length}`} accent="blue" icon={<ProgressIcon className="h-4 w-4" />} />
          <StatCard label="Level" value={profile.currentLevel} accent="violet" icon={<LevelIcon className="h-4 w-4" />} />
        </section>

        {/* ── Level selector ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur animate-slide-up">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Your level</h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => {
              const active = profile.currentLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => void updateLevel({ level })}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold transition duration-200 ${active
                      ? "text-white shadow-md shadow-indigo-500/25"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  style={active ? { background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" } : undefined}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Level progress ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur animate-slide-up">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Level progress</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {profile.currentLevel} &mdash; {currentLevelProgress?.completedTopics ?? 0} of {currentLevelProgress?.totalTopics ?? 0} topics
              </h2>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{currentLevelProgress?.percentage ?? 0}%</p>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${currentLevelProgress?.percentage ?? 0}%`,
                background: "linear-gradient(90deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)",
              }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {levelProgress?.levels.map((item) => {
              const active = item.level === profile.currentLevel;
              return (
                <div
                  key={item.level}
                  className={`rounded-xl border p-3 transition ${active ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-slate-50/80"
                    }`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className={active ? "text-indigo-700" : "text-slate-600"}>{item.level}</span>
                    {item.percentage === 100 && (
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {item.percentage < 100 && (
                      <span className={`text-xs ${active ? "text-indigo-500" : "text-slate-400"}`}>
                        {item.percentage}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                        background: active ? "linear-gradient(90deg, #4F46E5, #7C3AED)" : "#CBD5E1",
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{item.completedTopics}/{item.totalTopics} topics</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Up next ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm animate-slide-up">
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-400 to-amber-200" />
          <div className="ml-2">
            <div className="flex items-center gap-2 mb-1">
              <SparkleIcon className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Up next</p>
            </div>
            {nextTopic ? (
              <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs text-slate-400 font-medium">Topic {nextTopic.order} &middot; {nextTopic.category}</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{nextTopic.title}</h2>
                  <p className="mt-0.5 text-base font-semibold text-amber-700">{nextTopic.titleUzbek}</p>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{nextTopic.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {nextTopic.keyVocabulary.slice(0, 5).map((word) => (
                      <span
                        key={word.uzbek}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
                      >
                        {word.uzbek}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => void handleGenerateExercises(nextTopic as Topic)}
                  disabled={generating || !curriculumReady}
                  className="group relative shrink-0 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-400/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:transform-none"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)" }}
                >
                  <span className="relative z-10">
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <span className="dot-spinner"><span /><span /><span /></span>
                        Generating
                      </span>
                    ) : "Start this topic →"}
                  </span>
                  <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </div>
            ) : (
              <p className="mt-2 text-slate-600">
                {curriculumReady
                  ? "You have completed this level — choose the next CEFR level to continue."
                  : "Preparing your curriculum…"}
              </p>
            )}
          </div>
        </section>

        {/* ── Curriculum explorer ───────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Curriculum</h2>
              <p className="text-base font-semibold text-slate-900 mt-0.5">Choose a topic for a focused lesson</p>
            </div>
            <div className="relative">
              <select
                value={topicCategory}
                onChange={(event) => setTopicCategory(event.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              >
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
            {filteredTopics.map(({ topic, status, lastScore }) => {
              const expanded = selectedTopicId === topic._id;
              const isNext = topic._id === nextTopic?._id;

              const statusLabel =
                status === "completed" ? "Completed" :
                  status === "in_progress" ? "In progress" :
                    isNext ? "Up next" : "Available";

              const statusCls =
                status === "completed" ? "bg-emerald-100 text-emerald-700" :
                  status === "in_progress" ? "bg-amber-100 text-amber-700" :
                    isNext ? "bg-indigo-100 text-indigo-700" :
                      "bg-slate-100 text-slate-500";

              const dotCls =
                status === "completed" ? "bg-emerald-400" :
                  status === "in_progress" ? "bg-amber-400" :
                    isNext ? "bg-indigo-400" :
                      "bg-slate-300";

              return (
                <div
                  key={topic._id}
                  className={`rounded-xl border transition-all duration-200 ${expanded
                      ? "border-indigo-200 bg-indigo-50/40"
                      : "border-slate-100 bg-slate-50/50 hover:border-indigo-100 hover:bg-indigo-50/20"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId(expanded ? null : topic._id ?? null)}
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >
                    {/* Status dot */}
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotCls}`} />
                    {/* Order number */}
                    <span className="w-6 text-center text-xs font-bold text-slate-400 shrink-0">{topic.order}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{topic.title}</span>
                      <span className="block truncate text-xs text-slate-500">{topic.titleUzbek} &middot; {topic.category}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
                        {statusLabel}{lastScore !== null ? ` · ${lastScore}%` : ""}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition duration-200 ${expanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-indigo-100 px-4 pb-4 pt-3 animate-slide-down">
                      <p className="text-sm text-slate-600 leading-relaxed">{topic.description}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Grammar</p>
                          <p className="mt-0.5 text-sm text-slate-700">{topic.grammarFocus}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vocabulary</p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {topic.keyVocabulary.slice(0, 4).map((word) => (
                              <span key={word.uzbek} className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                                {word.uzbek}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleGenerateExercises(topic as Topic)}
                        disabled={generating || !curriculumReady || status === "completed"}
                        className="mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                      >
                        {status === "completed" ? "✓ Topic completed" : "Generate focused lesson"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Skill progress ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur animate-slide-up">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Skill progress</h2>
          <div className="space-y-5">
            {EXERCISE_TYPES.map((type, i) => {
              const sc = SKILL_COLORS[type] ?? SKILL_COLORS.vocabulary;
              const pct = Math.min(100, (profile.skillXp[type] / maxSkillXp) * 100);
              return (
                <div key={type} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${sc.topBar}`} />
                      <span className="font-semibold text-slate-700">
                        {EXERCISE_ICONS[type]} {EXERCISE_LABELS[type]}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${sc.text}`}>{profile.skillXp[type]} XP</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${sc.topBar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Today's exercises ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur animate-slide-up">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Today&apos;s exercises</h2>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
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
                <span className="relative z-10">
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <span className="dot-spinner"><span /><span /><span /></span>
                      Generating
                    </span>
                  ) : "Start today's lesson"}
                </span>
                <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {session ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {EXERCISE_TYPES.map((type) => {
                const exercise = exercises.find((e) => e.type === type);
                const done = exercise?.status === "completed";
                const sc = SKILL_COLORS[type] ?? SKILL_COLORS.vocabulary;

                return (
                  <Link
                    key={type}
                    href={exercise ? `/exercise/${exercise._id}` : "#"}
                    className={`group relative overflow-hidden rounded-2xl border transition duration-200 ${done
                        ? `${sc.border} ${sc.bg}`
                        : "border-slate-100 bg-white hover:border-indigo-200 card-hover"
                      } ${!exercise ? "pointer-events-none opacity-50" : ""}`}
                  >
                    {/* Colored top bar */}
                    <div className={`h-0.5 w-full ${sc.topBar}`} />
                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-2xl">{EXERCISE_ICONS[type]}</span>
                        {done && <CheckIcon className="h-5 w-5 text-emerald-500" />}
                      </div>
                      <h3 className="font-semibold text-slate-900">{EXERCISE_LABELS[type]}</h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{exercise?.title ?? "Not available"}</p>
                      {done && exercise?.score !== undefined && (
                        <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${sc.badge} ${sc.badgeText}`}>
                          {exercise.score}%
                        </span>
                      )}
                      {!done && exercise && (
                        <p className={`mt-3 text-xs font-bold ${sc.text} group-hover:underline`}>
                          Start →
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                <SparkleIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Click &ldquo;Start today&apos;s lesson&rdquo; to get {EXERCISE_TYPES.length} AI-generated exercises tailored to your {profile.currentLevel} level.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* ── Password change modal ─────────────────────────────────────────────── */}
      {passwordModalOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-title"
        >
          <div className="w-full max-w-md animate-scale-in glass-elevated rounded-3xl p-7">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="password-title" className="text-xl font-bold text-slate-900">Change password</h2>
                <p className="mt-1 text-sm text-slate-500">Use at least 8 characters.</p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => void handlePasswordChange(e)} className="space-y-3">
              <input type="password" required minLength={8} placeholder="Current password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} className={modalInputCls} />
              <input type="password" required minLength={8} placeholder="New password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} className={modalInputCls} />
              <input type="password" required minLength={8} placeholder="Confirm new password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className={modalInputCls} />
              {passwordMessage && (
                <p className={`text-sm ${passwordMessage.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
                  {passwordMessage}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                >
                  {passwordSaving ? "Updating…" : "Update password"}
                </button>
                <button type="button" onClick={() => setPasswordModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

