import type { DailyExerciseSet, Level, Topic } from "./types";

const SYSTEM_PROMPT = `You are an expert Uzbek language teacher creating daily exercises for English-speaking learners.
You teach Uzbek using the Latin alphabet (not Cyrillic).
Always respond with valid JSON only — no markdown, no code fences, no extra text.
Exercises must be appropriate for the given CEFR level (A1=beginner, A2=elementary, B1=intermediate, B2=upper-intermediate).
Include transliteration for Uzbek text when helpful for beginners.
Make content culturally relevant and practical for everyday use in Uzbekistan.`;

function buildPrompt(level: Level, topic?: Topic) {
  const topicInstructions = topic
    ? `\nThis is a targeted lesson for topic ${topic.order}: ${topic.title} (${topic.titleUzbek}).
Theme: ${topic.description}
Target vocabulary: ${topic.keyVocabulary.map((word) => `${word.uzbek} (${word.english})`).join(", ")}
Grammar focus: ${topic.grammarFocus}
Every exercise must directly practice this topic. Do not introduce an unrelated grammar point.`
    : "";
  return `Create a daily Uzbek language exercise set for level ${level}.
${topicInstructions}

Return JSON with this exact structure:
{
  "exercises": [
    {
      "type": "vocabulary",
      "title": "string",
      "instructions": "string",
      "content": {
        "words": [{ "uzbek": "string", "english": "string", "transliteration": "string" }],
        "questions": [{ "prompt": "string", "options": ["string","string","string","string"], "answer": "string" }]
      }
    },
    {
      "type": "grammar",
      "title": "string",
      "instructions": "string",
      "content": {
        "topic": "string",
        "explanation": "string (2-3 sentences)",
        "questions": [{ "prompt": "string", "answer": "string", "hint": "string" }]
      }
    },
    {
      "type": "listening",
      "title": "string",
      "instructions": "string",
      "content": {
        "audioText": "string (Uzbek sentence, 1-2 sentences)",
        "transliteration": "string",
        "translation": "string",
        "questions": [{ "prompt": "string", "answer": "string" }]
      }
    },
    {
      "type": "reading",
      "title": "string",
      "instructions": "string",
      "content": {
        "passage": "string (Uzbek paragraph, 3-5 sentences for ${level})",
        "transliteration": "string",
        "translation": "string",
        "questions": [{ "prompt": "string", "answer": "string" }]
      }
    },
    {
      "type": "writing",
      "title": "string",
      "instructions": "string",
      "content": {
        "prompt": "string (English instruction)",
        "sampleAnswer": "string (Uzbek)",
        "keywords": ["string"]
      }
    },
  ]
}

Include exactly 5 exercises, one of each type, in this order: vocabulary, grammar, listening, reading, writing.
For vocabulary include 4 words and 3 multiple-choice questions.
For grammar include 2 fill-in-the-blank questions.
For listening and reading include 2 comprehension questions each.
Level ${level} difficulty.`;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function getResponseText(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.response === "string") return obj.response;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.output === "string") return obj.output;
    if (Array.isArray(obj.choices) && obj.choices[0]) {
      const choice = obj.choices[0] as Record<string, unknown>;
      const message = choice.message as Record<string, unknown> | undefined;
      if (message && typeof message.content === "string") {
        return message.content;
      }
    }
  }
  return JSON.stringify(data);
}

export async function generateDailyExercises(
  level: Level,
  topic?: Topic,
): Promise<DailyExerciseSet> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildPrompt(level, topic),
      system_prompt: SYSTEM_PROMPT,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate exercises (${response.status})`);
  }

  const data: unknown = await response.json();
  const text = getResponseText(data);
  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr) as DailyExerciseSet;

  if (!parsed.exercises || parsed.exercises.length !== 5) {
    throw new Error("Invalid exercise set from AI");
  }

  return parsed;
}

export async function evaluateWritingAnswer(
  prompt: string,
  userAnswer: string,
  sampleAnswer: string,
  keywords: string[],
): Promise<{ score: number; feedback: string }> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_prompt:
        "You are an Uzbek language teacher evaluating student writing. Respond with JSON only: { \"score\": number 0-100, \"feedback\": \"string\" }",
      prompt: `Evaluate this Uzbek writing exercise.
Prompt: ${prompt}
Sample answer: ${sampleAnswer}
Expected keywords: ${keywords.join(", ")}
Student answer: ${userAnswer}

Score based on grammar, vocabulary use, and whether the meaning matches the prompt. Be encouraging but accurate.`,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to evaluate writing");
  }

  const data: unknown = await response.json();
  const text = getResponseText(data);
  const jsonStr = extractJson(text);
  return JSON.parse(jsonStr) as { score: number; feedback: string };
}

export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, " ");
}

export function checkExactAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

export function checkPartialMatch(userAnswer: string, correctAnswer: string): boolean {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  return user.includes(correct) || correct.includes(user);
}
