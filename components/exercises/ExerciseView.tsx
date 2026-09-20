"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  checkExactAnswer,
  checkPartialMatch,
  evaluateWritingAnswer,
} from "@/lib/ai";
import {
  EXERCISE_ICONS,
  EXERCISE_LABELS,
  type ExerciseType,
  type GrammarContent,
  type ListeningContent,
  type ReadingContent,
  type VocabularyContent,
  type WritingContent,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExerciseDoc {
  _id: Id<"exercises">;
  type: ExerciseType;
  title: string;
  instructions: string;
  content: unknown;
  status: "pending" | "completed";
  score?: number;
  feedback?: string;
  userAnswer?: string;
}

// ─── Skill color config ────────────────────────────────────────────────────────
const SKILL_COLORS: Record<string, { border: string; bg: string; text: string; pill: string; pillText: string; bar: string }> = {
  vocabulary: { border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-700", pill: "bg-indigo-100", pillText: "text-indigo-700", bar: "bg-indigo-500" },
  grammar: { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700", pill: "bg-violet-100", pillText: "text-violet-700", bar: "bg-violet-500" },
  listening: { border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700", pill: "bg-sky-100", pillText: "text-sky-700", bar: "bg-sky-500" },
  reading: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", pill: "bg-emerald-100", pillText: "text-emerald-700", bar: "bg-emerald-500" },
  writing: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", pill: "bg-amber-100", pillText: "text-amber-700", bar: "bg-amber-500" },
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const cardCls = "rounded-2xl border border-slate-100 bg-white/80 p-6  shadow-sm";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white disabled:opacity-60 disabled:bg-slate-50";
const submitBtnCls =
  "group relative overflow-hidden rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none";

// ─── Helper components ─────────────────────────────────────────────────────────
function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3.5 ">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
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

// ─── Main ExerciseView ────────────────────────────────────────────────────────
export function ExerciseView({ exercise }: { exercise: ExerciseDoc }) {
  const router = useRouter();
  const submitExercise = useMutation(api.exercises.submitExercise);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    feedback: string;
  } | null>(
    exercise.status === "completed" && exercise.score !== undefined
      ? { score: exercise.score, feedback: exercise.feedback ?? "" }
      : null,
  );
  const [topicCompletion, setTopicCompletion] = useState<{
    completedTopics: number;
    totalTopics: number;
    percentage: number;
    nextTopic: { _id: Id<"topics">; title: string; titleUzbek: string; order: number } | null;
  } | null>(null);

  async function handleSubmit(
    userAnswer: string,
    score: number,
    feedback: string,
  ) {
    setSubmitting(true);
    try {
      const submission = await submitExercise({
        exerciseId: exercise._id,
        userAnswer,
        score,
        feedback,
      });
      setResult({ score, feedback });
      if (submission.topicCompletion) {
        setTopicCompletion(submission.topicCompletion);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const sc = SKILL_COLORS[exercise.type] ?? SKILL_COLORS.vocabulary;
  const content = exercise.content;

  return (
    <div className="min-h-screen bg-grid">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky bg-white top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-bold ${sc.pill} ${sc.pillText}`}>
                {EXERCISE_ICONS[exercise.type]} {EXERCISE_LABELS[exercise.type]}
              </span>
            </div>
            <h1 className="mt-0.5 truncate font-semibold text-slate-900">{exercise.title}</h1>
          </div>

          {/* Completion badge */}
          {exercise.status === "completed" && (
            <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Done
            </span>
          )}
        </div>

        {/* Skill color bar */}
        <div className={`h-0.5 ${sc.bar}`} />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <InfoCallout>{exercise.instructions}</InfoCallout>

        {exercise.type === "vocabulary" && (
          <VocabularyExercise
            content={content as VocabularyContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            completed={exercise.status === "completed"}
          />
        )}
        {exercise.type === "grammar" && (
          <GrammarExercise
            content={content as GrammarContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            completed={exercise.status === "completed"}
          />
        )}
        {exercise.type === "listening" && (
          <ListeningExercise
            content={content as ListeningContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            completed={exercise.status === "completed"}
          />
        )}
        {exercise.type === "reading" && (
          <ReadingExercise
            content={content as ReadingContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            completed={exercise.status === "completed"}
          />
        )}
        {exercise.type === "writing" && (
          <WritingExercise
            content={content as WritingContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            completed={exercise.status === "completed"}
          />
        )}

        {/* ── Result panel ──────────────────────────────────────────────────── */}
        {result && (
          <div className={`mt-8 animate-scale-bounce rounded-2xl border p-6 ${result.score >= 70
            ? "border-emerald-200 bg-emerald-50"
            : result.score >= 40
              ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
            }`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${result.score >= 70 ? "bg-emerald-100" : result.score >= 40 ? "bg-amber-100" : "bg-red-100"
                }`}>
                {result.score >= 70 ? "🎉" : result.score >= 40 ? "👍" : "💪"}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${result.score >= 70 ? "text-emerald-600" : result.score >= 40 ? "text-amber-600" : "text-red-500"
                  }`}>Your score</p>
                <p className="text-4xl font-extrabold text-slate-900">{result.score}<span className="text-2xl text-slate-400">%</span></p>
              </div>
            </div>
            {result.feedback && (
              <p className="mt-4 text-sm text-slate-700 leading-relaxed">{result.feedback}</p>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
            >
              Back to dashboard
            </button>
          </div>
        )}

        {/* ── Topic completion modal ─────────────────────────────────────────── */}
        {topicCompletion && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 "
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-complete-title"
          >
            <div className="w-full max-w-md animate-scale-bounce glass-elevated rounded-3xl p-8 text-center">
              <div className="mb-4 text-6xl animate-float">🎉</div>
              <h2 id="topic-complete-title" className="text-2xl font-bold text-slate-900">
                Topic completed!
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {topicCompletion.completedTopics} of {topicCompletion.totalTopics} topics in this level &mdash; {topicCompletion.percentage}% done
              </p>

              {/* Level progress mini bar */}
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${topicCompletion.percentage}%`,
                    background: "linear-gradient(90deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)",
                  }}
                />
              </div>

              {topicCompletion.nextTopic ? (
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                    Up next &middot; Topic {topicCompletion.nextTopic.order}
                  </p>
                  <p className="mt-1 font-bold text-slate-900">{topicCompletion.nextTopic.title}</p>
                  <p className="text-sm font-medium text-indigo-700">{topicCompletion.nextTopic.titleUzbek}</p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900">
                  <p className="font-semibold">🏆 Level complete!</p>
                  <p className="mt-0.5 text-sm">You&apos;ve mastered every topic in this level.</p>
                </div>
              )}

              <button
                onClick={() =>
                  router.push(
                    topicCompletion.nextTopic
                      ? `/dashboard?topicId=${topicCompletion.nextTopic._id}`
                      : "/dashboard",
                  )
                }
                className="group relative mt-5 w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
              >
                {topicCompletion.nextTopic ? "Continue to next topic →" : "Back to dashboard"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── VocabularyExercise ───────────────────────────────────────────────────────
function VocabularyExercise({
  content,
  onSubmit,
  submitting,
  completed,
}: {
  content: VocabularyContent;
  onSubmit: (answer: string, score: number, feedback: string) => Promise<void>;
  submitting: boolean;
  completed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let correct = 0;
    content.questions.forEach((q, i) => {
      if (checkExactAnswer(answers[i] ?? "", q.answer)) correct++;
    });
    const score = Math.round((correct / content.questions.length) * 100);
    void onSubmit(
      JSON.stringify(answers),
      score,
      `You got ${correct} out of ${content.questions.length} correct.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">New words</h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {content.words.map((word) => (
            <div
              key={word.uzbek}
              className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50/40 px-4 py-3 transition hover:border-indigo-200"
            >
              <p className="font-bold text-indigo-900">{word.uzbek}</p>
              {word.transliteration && (
                <p className="text-xs text-indigo-400 mt-0.5">{word.transliteration}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">{word.english}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-3 font-semibold text-slate-800">{q.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt) => {
                const selected = answers[i] === opt;
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition duration-150 ${selected
                      ? "border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm shadow-indigo-100"
                      : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                      }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                      }`}>
                      {selected && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={opt}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                      disabled={completed}
                      className="sr-only"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting || Object.keys(answers).length < content.questions.length}
            className={submitBtnCls}
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {submitting ? <><LoadingDots /> Checking…</> : "Check answers"}
            </span>
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        )}
      </form>
    </div>
  );
}

// ─── GrammarExercise ──────────────────────────────────────────────────────────
function GrammarExercise({
  content,
  onSubmit,
  submitting,
  completed,
}: {
  content: GrammarContent;
  onSubmit: (answer: string, score: number, feedback: string) => Promise<void>;
  submitting: boolean;
  completed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let correct = 0;
    content.questions.forEach((q, i) => {
      if (checkExactAnswer(answers[i] ?? "", q.answer)) correct++;
      else if (checkPartialMatch(answers[i] ?? "", q.answer)) correct += 0.5;
    });
    const score = Math.round((correct / content.questions.length) * 100);
    void onSubmit(
      JSON.stringify(answers),
      score,
      `Grammar: ${Math.floor(correct)}/${content.questions.length} correct.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardCls} border-l-4 border-l-violet-400`}>
        <h3 className="font-bold text-violet-700">{content.topic}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{content.explanation}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-2 font-semibold text-slate-800">{q.prompt}</p>
            {q.hint && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-amber-700">Hint: {q.hint}</p>
              </div>
            )}
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              disabled={completed}
              className={inputCls}
              placeholder="Your answer in Uzbek"
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className={submitBtnCls}
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {submitting ? <><LoadingDots /> Checking…</> : "Check answers"}
            </span>
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        )}
      </form>
    </div>
  );
}

// ─── ListeningExercise ────────────────────────────────────────────────────────
function ListeningExercise({
  content,
  onSubmit,
  submitting,
  completed,
}: {
  content: ListeningContent;
  onSubmit: (answer: string, score: number, feedback: string) => Promise<void>;
  submitting: boolean;
  completed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);

  function playAudio() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.audioText);
    utterance.lang = "tr-TR";
    utterance.rate = 0.85;
    setPlaying(true);
    utterance.onend = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let correct = 0;
    content.questions.forEach((q, i) => {
      if (checkExactAnswer(answers[i] ?? "", q.answer)) correct++;
      else if (checkPartialMatch(answers[i] ?? "", q.answer)) correct += 0.5;
    });
    const score = Math.round((correct / content.questions.length) * 100);
    void onSubmit(
      JSON.stringify(answers),
      score,
      `Listening: ${Math.floor(correct)}/${content.questions.length} correct.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardCls} text-center`}>
        {/* Play button with pulse ring */}
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          {playing && (
            <>
              <span className="absolute inset-0 rounded-full bg-sky-400/30 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-sky-400/20 animate-ping" style={{ animationDelay: "0.3s" }} />
            </>
          )}
          <button
            type="button"
            onClick={playAudio}
            disabled={playing}
            className="relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg shadow-sky-400/30 transition duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-80"
            style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)" }}
          >
            {playing ? (
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-8 w-8 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-500">
          {playing ? "Playing…" : "Tap to listen, then answer the questions below."}
        </p>

        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="mt-3 text-sm font-medium text-sky-600 transition hover:text-sky-800"
        >
          {revealed ? "Hide transcript ↑" : "Show transcript ↓"}
        </button>

        {revealed && (
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-left animate-slide-down">
            <p className="font-semibold text-slate-900 leading-relaxed">{content.audioText}</p>
            <p className="mt-1.5 text-sm text-sky-500 italic">{content.transliteration}</p>
            <p className="mt-1 text-sm text-slate-600 italic">{content.translation}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-3 font-semibold text-slate-800">{q.prompt}</p>
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              disabled={completed}
              className={inputCls}
              placeholder="Your answer…"
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className={submitBtnCls}
            style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {submitting ? <><LoadingDots /> Checking…</> : "Check answers"}
            </span>
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        )}
      </form>
    </div>
  );
}

// ─── ReadingExercise ──────────────────────────────────────────────────────────
function ReadingExercise({
  content,
  onSubmit,
  submitting,
  completed,
}: {
  content: ReadingContent;
  onSubmit: (answer: string, score: number, feedback: string) => Promise<void>;
  submitting: boolean;
  completed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showTranslation, setShowTranslation] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let correct = 0;
    content.questions.forEach((q, i) => {
      if (checkExactAnswer(answers[i] ?? "", q.answer)) correct++;
      else if (checkPartialMatch(answers[i] ?? "", q.answer)) correct += 0.5;
    });
    const score = Math.round((correct / content.questions.length) * 100);
    void onSubmit(
      JSON.stringify(answers),
      score,
      `Reading: ${Math.floor(correct)}/${content.questions.length} correct.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardCls} border-l-4 border-l-emerald-400`}>
        <p className="text-base leading-[1.8] text-slate-900">{content.passage}</p>
        {content.transliteration && (
          <p className="mt-3 text-sm text-emerald-500 italic leading-relaxed">{content.transliteration}</p>
        )}
        <button
          type="button"
          onClick={() => setShowTranslation(!showTranslation)}
          className="mt-3 text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
        >
          {showTranslation ? "Hide translation ↑" : "Show translation ↓"}
        </button>
        {showTranslation && (
          <p className="mt-2 text-sm italic text-slate-600 leading-relaxed animate-slide-down">{content.translation}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-3 font-semibold text-slate-800">{q.prompt}</p>
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              disabled={completed}
              className={inputCls}
              placeholder="Your answer…"
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className={submitBtnCls}
            style={{ background: "linear-gradient(135deg, #059669 0%, #34D399 100%)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {submitting ? <><LoadingDots /> Checking…</> : "Check answers"}
            </span>
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        )}
      </form>
    </div>
  );
}

// ─── WritingExercise ──────────────────────────────────────────────────────────
function WritingExercise({
  content,
  onSubmit,
  submitting,
  completed,
}: {
  content: WritingContent;
  onSubmit: (answer: string, score: number, feedback: string) => Promise<void>;
  submitting: boolean;
  completed: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEvaluating(true);
    try {
      const result = await evaluateWritingAnswer(
        content.prompt,
        answer,
        content.sampleAnswer,
        content.keywords,
      );
      await onSubmit(answer, result.score, result.feedback);
    } catch {
      await onSubmit(
        answer,
        checkPartialMatch(answer, content.sampleAnswer) ? 60 : 20,
        "Could not evaluate automatically. Compare with the sample answer.",
      );
    } finally {
      setEvaluating(false);
    }
  }

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className={`${cardCls} border-l-4 border-l-amber-400`}>
        <p className="font-semibold text-slate-900 leading-relaxed">{content.prompt}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide self-center mr-1">Keywords:</span>
          {content.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Writing surface */}
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={completed}
          rows={6}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:bg-white disabled:opacity-60 disabled:bg-slate-50"
          placeholder="Write your answer in Uzbek…"
        />
        <p className="absolute bottom-3 right-4 text-xs text-slate-400">
          {wordCount} word{wordCount !== 1 ? "s" : ""}
        </p>
      </div>

      {!completed && (
        <button
          type="submit"
          disabled={submitting || evaluating || !answer.trim()}
          className={submitBtnCls}
          style={{ background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)" }}
        >
          <span className="relative z-10 flex items-center gap-2">
            {evaluating || submitting ? <><LoadingDots /> Evaluating…</> : "Submit writing"}
          </span>
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
        </button>
      )}
    </form>
  );
}
