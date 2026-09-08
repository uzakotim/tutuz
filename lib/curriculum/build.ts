import type { Level } from "../types";
import type { CurriculumTopic } from "./types";

type TopicSeed = readonly [
  title: string,
  titleUzbek: string,
  category: string,
  description: string,
  grammarFocus: string,
  vocabulary: readonly [string, string, string, string],
];

export function buildTopics(level: Level, seeds: readonly TopicSeed[]): CurriculumTopic[] {
  return seeds.map(([title, titleUzbek, category, description, grammarFocus, vocabulary], index) => ({
    order: index + 1,
    level,
    title,
    titleUzbek,
    category,
    description,
    grammarFocus,
    keyVocabulary: vocabulary.map((entry) => {
      const [uzbek, english] = entry.split(" = ", 2);
      return { uzbek, english };
    }),
  }));
}
