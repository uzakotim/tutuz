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
  evaluateSpeakingAnswer,
  evaluateWritingAnswer,
} from "@/lib/ai";
import {
  EXERCISE_ICONS,
  EXERCISE_LABELS,
  type ExerciseType,
  type GrammarContent,
  type ListeningContent,
  type ReadingContent,
  type SpeakingContent,
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

  async function handleSubmit(
    userAnswer: string,
    score: number,
    feedback: string,
  ) {
    setSubmitting(true);
    try {
      await submitExercise({
        exerciseId: exercise._id,
        userAnswer,
        score,
        feedback,
      });
      setResult({ score, feedback });
    } finally {
      setSubmitting(false);
    }
  }

  const content = exercise.content;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50">
      <header className="border-b border-teal-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-teal-600 hover:text-teal-800"
          >
            ← Back
          </Link>
          <div>
            <p className="text-xs text-slate-500">
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
        {exercise.type === "speaking" && (
          <SpeakingExercise
            content={content as SpeakingContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            completed={exercise.status === "completed"}
          />
        )}

        {result && (
          <div
            className={`mt-8 rounded-2xl border p-6 ${
              result.score >= 70
                ? "border-teal-200 bg-teal-50"
                : result.score >= 40
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <h3 className="text-lg font-semibold">
              Score: {result.score}%
            </h3>
            {result.feedback && (
              <p className="mt-2 text-slate-700">{result.feedback}</p>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Back to dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">New words</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {content.words.map((word) => (
            <div
              key={word.uzbek}
              className="rounded-xl bg-teal-50 px-4 py-3"
            >
              <p className="font-semibold text-teal-900">{word.uzbek}</p>
              {word.transliteration && (
                <p className="text-xs text-teal-600">{word.transliteration}</p>
              )}
              <p className="text-sm text-slate-600">{word.english}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="mb-3 font-medium">{q.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 transition ${
                    answers[i] === opt
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 hover:border-teal-300"
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
                    className="accent-teal-600"
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
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Check answers"}
          </button>
        )}
      </form>
    </div>
  );
}

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-teal-800">{content.topic}</h3>
        <p className="mt-2 text-slate-600">{content.explanation}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="mb-2 font-medium">{q.prompt}</p>
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-teal-500"
              placeholder="Your answer in Uzbek"
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Check answers"}
          </button>
        )}
      </form>
    </div>
  );
}

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <button
          type="button"
          onClick={playAudio}
          disabled={playing}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-600 text-3xl text-white transition hover:bg-teal-700 disabled:opacity-70"
        >
          {playing ? "🔊" : "▶️"}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Listen carefully, then answer the questions below.
        </p>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="mt-3 text-sm text-teal-600 hover:underline"
        >
          {revealed ? "Hide transcript" : "Show transcript"}
        </button>
        {revealed && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left">
            <p className="font-medium text-slate-900">{content.audioText}</p>
            <p className="mt-1 text-sm text-slate-500">
              {content.transliteration}
            </p>
            <p className="mt-1 text-sm italic text-slate-600">
              {content.translation}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="mb-3 font-medium">{q.prompt}</p>
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              disabled={completed}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-teal-500"
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Check answers"}
          </button>
        )}
      </form>
    </div>
  );
}

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="leading-relaxed text-slate-900">{content.passage}</p>
        <p className="mt-3 text-sm text-slate-500">{content.transliteration}</p>
        <button
          type="button"
          onClick={() => setShowTranslation(!showTranslation)}
          className="mt-3 text-sm text-teal-600 hover:underline"
        >
          {showTranslation ? "Hide translation" : "Show translation"}
        </button>
        {showTranslation && (
          <p className="mt-2 italic text-slate-600">{content.translation}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {content.questions.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="mb-3 font-medium">{q.prompt}</p>
            <input
              type="text"
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              disabled={completed}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-teal-500"
            />
          </div>
        ))}
        {!completed && (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Check answers"}
          </button>
        )}
      </form>
    </div>
  );
}

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
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
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
        placeholder="Write your answer in Uzbek..."
      />
      {!completed && (
        <button
          type="submit"
          disabled={submitting || evaluating || !answer.trim()}
          className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {evaluating || submitting ? "Evaluating..." : "Submit writing"}
        </button>
      )}
    </form>
  );
}

function SpeakingExercise({
  content,
  onSubmit,
  submitting,
  completed,
}: {
  content: SpeakingContent;
  onSubmit: (answer: string, score: number, feedback: string) => Promise<void>;
  submitting: boolean;
  completed: boolean;
}) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [supported, setSupported] = useState(true);

  function startListening() {
    type SpeechRecognitionCtor = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      start: () => void;
    };

    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };

    const SpeechRecognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;
    setListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEvaluating(true);
    try {
      const result = await evaluateSpeakingAnswer(
        content.targetSentence,
        transcript,
        content.keywords,
      );
      await onSubmit(transcript, result.score, result.feedback);
    } catch {
      await onSubmit(
        transcript,
        checkPartialMatch(transcript, content.targetSentence) ? 60 : 20,
        "Could not evaluate automatically. Compare with the target sentence.",
      );
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="font-medium text-slate-900">{content.englishPrompt}</p>
        <div className="mt-4 rounded-xl bg-teal-50 p-4">
          <p className="text-sm text-teal-800">Say this in Uzbek:</p>
          <p className="mt-1 font-semibold text-teal-900">
            {content.targetSentence}
          </p>
          {content.transliteration && (
            <p className="mt-1 text-sm text-teal-600">
              {content.transliteration}
            </p>
          )}
        </div>
      </div>

      {!supported && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Speech recognition is not supported in this browser. Type your sentence
          below instead.
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {supported && (
          <button
            type="button"
            onClick={startListening}
            disabled={listening || completed}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-500 text-2xl text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {listening ? "⏺" : "🎤"}
          </button>
        )}
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={completed}
          rows={3}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
          placeholder={
            supported
              ? "Your spoken answer will appear here..."
              : "Type the Uzbek sentence you would say..."
          }
        />
      </div>

      {!completed && (
        <button
          type="submit"
          disabled={submitting || evaluating || !transcript.trim()}
          className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {evaluating || submitting ? "Evaluating..." : "Submit speaking"}
        </button>
      )}
    </form>
  );
}
