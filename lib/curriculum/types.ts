import type { Level } from "../types";

export interface CurriculumTopic {
  order: number;
  level: Level;
  title: string;
  titleUzbek: string;
  category: string;
  description: string;
  keyVocabulary: Array<{
    uzbek: string;
    english: string;
  }>;
  grammarFocus: string;
}
