import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const levelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

export const exerciseTypeValidator = v.union(
  v.literal("vocabulary"),
  v.literal("grammar"),
  v.literal("listening"),
  v.literal("reading"),
  v.literal("writing"),
  // Kept for validating historical sessions; no new content generates it.
  v.literal("speaking"),
);

export const topicStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("completed"),
);

export default defineSchema({
  ...authTables,
  userProfiles: defineTable({
    userId: v.id("users"),
    currentLevel: levelValidator,
    displayName: v.optional(v.string()),
    streakDays: v.number(),
    lastActiveDate: v.optional(v.string()),
    totalXp: v.number(),
    skillXp: v.object({
      vocabulary: v.number(),
      grammar: v.number(),
      listening: v.number(),
      reading: v.number(),
      writing: v.number(),
      // Kept for validating historical profiles; hidden from the product UI.
      speaking: v.number(),
    }),
  }).index("by_user", ["userId"]),

  dailySessions: defineTable({
    userId: v.id("users"),
    date: v.string(),
    level: levelValidator,
    completedCount: v.number(),
    totalCount: v.number(),
    status: v.union(v.literal("active"), v.literal("completed")),
    topicId: v.optional(v.id("topics")),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_topic", ["userId", "topicId"]),

  exercises: defineTable({
    userId: v.id("users"),
    sessionId: v.id("dailySessions"),
    type: exerciseTypeValidator,
    level: levelValidator,
    title: v.string(),
    instructions: v.string(),
    content: v.any(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    score: v.optional(v.number()),
    userAnswer: v.optional(v.string()),
    feedback: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    topicId: v.optional(v.id("topics")),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  topics: defineTable({
    level: levelValidator,
    order: v.number(),
    title: v.string(),
    titleUzbek: v.string(),
    category: v.string(),
    description: v.string(),
    keyVocabulary: v.array(v.object({ uzbek: v.string(), english: v.string() })),
    grammarFocus: v.string(),
  })
    .index("by_level_and_order", ["level", "order"])
    .index("by_level", ["level"]),

  userTopicProgress: defineTable({
    userId: v.id("users"),
    topicId: v.id("topics"),
    level: levelValidator,
    status: topicStatusValidator,
    completedAt: v.optional(v.number()),
    lastScore: v.optional(v.number()),
  })
    .index("by_user_and_topic", ["userId", "topicId"])
    .index("by_user_and_level", ["userId", "level"])
    .index("by_user", ["userId"]),
});
