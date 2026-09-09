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

  const content = exercise.content;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-800"
          >
            ← Back
          </Link>
          <div>
            <p className="text-xs font-medium text-indigo-500">
              {EXERCISE_ICONS[exercise.type]} {EXERCISE_LABELS[exercise.type]}
            </p>
            <h1 className="font-semibold text-slate-900">{exercise.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-6 text-slate-600">{exercise.instructions}</p>

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

        {result && (
          <div
            className={`mt-8 rounded-2xl border p-6 ${
              result.score >= 70
                ? "border-indigo-200 bg-indigo-50"
                : result.score >= 40
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {result.score >= 70 ? "🎉" : result.score >= 40 ? "👍" : "💪"}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">
                Score: {result.score}%
              </h3>
            </div>
            {result.feedback && (
              <p className="mt-2 text-slate-700">{result.feedback}</p>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
            >
              Back to dashboard
            </button>
          </div>
        )}

        {topicCompletion && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-complete-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 text-center shadow-2xl">
              <div className="text-5xl">🎉</div>
              <h2 id="topic-complete-title" className="mt-3 text-2xl font-bold text-slate-900">
                Topic completed!
              </h2>
              <p className="mt-2 text-slate-600">
                You&apos;ve completed {topicCompletion.completedTopics} of {topicCompletion.totalTopics} topics in this level ({topicCompletion.percentage}%).
              </p>
              {topicCompletion.nextTopic ? (
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Next topic · {topicCompletion.nextTopic.order}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{topicCompletion.nextTopic.title}</p>
                  <p className="text-sm font-medium text-indigo-700">{topicCompletion.nextTopic.titleUzbek}</p>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-900">
                  You&apos;ve completed every topic in this level.
                </p>
              )}
              <button
                onClick={() =>
                  router.push(
                    topicCompletion.nextTopic
                      ? `/dashboard?topicId=${topicCompletion.nextTopic._id}`
                      : "/dashboard",
                  )
                }
                className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
              >
                {topicCompletion.nextTopic ? "Continue to next topic lesson →" : "Back to dashboard"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardCls = "rounded-2xl border border-slate-100 bg-white/80 p-6 backdrop-blur shadow-sm";
const inputCls =
  "w-full rounded-xl border border-indigo-100 bg-white/70 px-4 py-2.5 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white disabled:opacity-60 disabled:bg-slate-50";
const submitBtnCls =
  "rounded-xl px-6 py-3 font-semibold text-white transition duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none";

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
        <h3 className="mb-4 font-semibold text-slate-900">New words</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {content.words.map((word) => (
            <div
              key={word.uzbek}
              className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 transition hover:border-indigo-200"
            >
              <p className="font-semibold text-indigo-900">{word.uzbek}</p>
              {word.transliteration && (
                <p className="text-xs text-indigo-500">{word.transliteration}</p>
              )}
              <p className="text-sm text-slate-600">{word.english}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-3 font-medium text-slate-800">{q.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 transition duration-150 ${
                    answers[i] === opt
                      ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${i}`}
                    value={opt}
                    checked={answers[i] === opt}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [i]: opt }))
                    }
                    disabled={completed}
                    className="accent-indigo-600"
                  />
                  {opt}
                </label>
              ))}
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
            {submitting ? "Submitting..." : "Check answers"}
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
      <div className={cardCls}>
        <h3 className="font-semibold text-indigo-700">{content.topic}</h3>
        <p className="mt-2 text-slate-600">{content.explanation}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-2 font-medium text-slate-800">{q.prompt}</p>
            {q.hint && (
              <p className="mb-3 text-sm text-slate-500">Hint: {q.hint}</p>
            )}
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
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
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            {submitting ? "Submitting..." : "Check answers"}
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
        <button
          type="button"
          onClick={playAudio}
          disabled={playing}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white shadow-lg shadow-indigo-500/30 transition duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
        >
          {playing ? "🔊" : "▶️"}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Listen carefully, then answer the questions below.
        </p>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {revealed ? "Hide transcript" : "Show transcript"}
        </button>
        {revealed && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-left">
            <p className="font-medium text-slate-900">{content.audioText}</p>
            <p className="mt-1 text-sm text-indigo-500">{content.transliteration}</p>
            <p className="mt-1 text-sm italic text-slate-600">{content.translation}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-3 font-medium text-slate-800">{q.prompt}</p>
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              disabled={completed}
              className={inputCls}
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className={submitBtnCls}
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            {submitting ? "Submitting..." : "Check answers"}
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
      <div className={cardCls}>
        <p className="leading-relaxed text-slate-900">{content.passage}</p>
        <p className="mt-3 text-sm text-indigo-500">{content.transliteration}</p>
        <button
          type="button"
          onClick={() => setShowTranslation(!showTranslation)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {showTranslation ? "Hide translation" : "Show translation"}
        </button>
        {showTranslation && (
          <p className="mt-2 italic text-slate-600">{content.translation}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div key={i} className={cardCls}>
            <p className="mb-3 font-medium text-slate-800">{q.prompt}</p>
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              disabled={completed}
              className={inputCls}
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className={submitBtnCls}
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
          >
            {submitting ? "Submitting..." : "Check answers"}
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

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className={cardCls}>
        <p className="font-medium text-slate-900">{content.prompt}</p>
        <p className="mt-2 text-sm text-slate-500">
          Keywords to try: {content.keywords.join(", ")}
        </p>
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={completed}
        rows={5}
        className={`${inputCls} resize-none`}
        placeholder="Write your answer in Uzbek..."
      />
      {!completed && (
        <button
          type="submit"
          disabled={submitting || evaluating || !answer.trim()}
          className={submitBtnCls}
          style={{ background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)" }}
        >
          {evaluating || submitting ? "Evaluating..." : "Submit writing"}
        </button>
      )}
    </form>
  );
}
