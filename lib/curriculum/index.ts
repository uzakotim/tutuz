import type { Level } from "../types";
import { A1_TOPICS } from "./a1";
import { A2_TOPICS } from "./a2";
import { B1_TOPICS } from "./b1";
import { B2_TOPICS } from "./b2";
import type { CurriculumTopic } from "./types";

export { A1_TOPICS, A2_TOPICS, B1_TOPICS, B2_TOPICS };
export type { CurriculumTopic } from "./types";

export const CURRICULUM_BY_LEVEL: Record<Level, CurriculumTopic[]> = {
  A1: A1_TOPICS,
  A2: A2_TOPICS,
  B1: B1_TOPICS,
  B2: B2_TOPICS,
};

export const ALL_CURRICULUM_TOPICS = Object.values(CURRICULUM_BY_LEVEL).flat();

export function getCurriculumForLevel(level: Level) {
  return CURRICULUM_BY_LEVEL[level];
}
