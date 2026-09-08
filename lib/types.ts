export type Level = "A1" | "A2" | "B1" | "B2";

export type ExerciseType =
  | "vocabulary"
  | "grammar"
  | "listening"
  | "reading"
  | "writing"
  | "speaking";

export const EXERCISE_TYPES: ExerciseType[] = [
  "vocabulary",
  "grammar",
  "listening",
  "reading",
  "writing",
  "speaking",
];

export const LEVELS: Level[] = ["A1", "A2", "B1", "B2"];

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const EXERCISE_ICONS: Record<ExerciseType, string> = {
  vocabulary: "📚",
  grammar: "✏️",
  listening: "🎧",
  reading: "📖",
  writing: "✍️",
  speaking: "🎤",
};

export interface VocabularyContent {
  words: Array<{
    uzbek: string;
    english: string;
    transliteration?: string;
  }>;
  questions: Array<{
    prompt: string;
    options: string[];
    answer: string;
  }>;
}

export interface GrammarContent {
  topic: string;
  explanation: string;
  questions: Array<{
    prompt: string;
    answer: string;
    hint?: string;
  }>;
}

export interface ListeningContent {
  audioText: string;
  transliteration: string;
  translation: string;
  questions: Array<{
    prompt: string;
    answer: string;
  }>;
}

export interface ReadingContent {
  passage: string;
  transliteration: string;
  translation: string;
  questions: Array<{
    prompt: string;
    answer: string;
  }>;
}

export interface WritingContent {
  prompt: string;
  sampleAnswer: string;
  keywords: string[];
}

export interface SpeakingContent {
  englishPrompt: string;
  targetSentence: string;
  keywords: string[];
  transliteration?: string;
}

export type ExerciseContent =
  | VocabularyContent
  | GrammarContent
  | ListeningContent
  | ReadingContent
  | WritingContent
  | SpeakingContent;

export interface GeneratedExercise {
  type: ExerciseType;
  title: string;
  instructions: string;
  content: ExerciseContent;
}

export interface DailyExerciseSet {
  exercises: GeneratedExercise[];
}
