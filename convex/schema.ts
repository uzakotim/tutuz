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
  }).index("by_user_and_date", ["userId", "date"]),

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
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),
});
