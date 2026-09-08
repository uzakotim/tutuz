import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurriculumForLevel } from "../lib/curriculum";
import { levelValidator, topicStatusValidator } from "./schema";
import { requireUserId } from "./lib/auth";

const levels = ["A1", "A2", "B1", "B2"] as const;
const MAX_TOPIC_BATCH_SIZE = 25;

const vocabularyValidator = v.array(v.object({ uzbek: v.string(), english: v.string() }));
const topicSummaryValidator = v.object({
  _id: v.id("topics"),
  level: levelValidator,
  order: v.number(),
  title: v.string(),
  titleUzbek: v.string(),
  category: v.string(),
  description: v.string(),
  keyVocabulary: vocabularyValidator,
  grammarFocus: v.string(),
});

const progressSummaryValidator = v.object({
  level: levelValidator,
  totalTopics: v.number(),
  completedTopics: v.number(),
  percentage: v.number(),
  nextTopic: v.union(v.null(), topicSummaryValidator),
});

function toTopicSummary(topic: Doc<"topics">) {
  return {
    _id: topic._id,
    level: topic.level,
    order: topic.order,
    title: topic.title,
    titleUzbek: topic.titleUzbek,
    category: topic.category,
    description: topic.description,
    keyVocabulary: topic.keyVocabulary,
    grammarFocus: topic.grammarFocus,
  };
}

async function seedLevelBatch(ctx: MutationCtx, level: (typeof levels)[number], limit: number) {
  const curriculum = getCurriculumForLevel(level);
  const existingTopics = await ctx.db
    .query("topics")
    .withIndex("by_level_and_order", (q) => q.eq("level", level))
    .take(120);
  const existingOrders = new Set(existingTopics.map((topic) => topic.order));
  const missingTopics = curriculum.filter((topic) => !existingOrders.has(topic.order));
  const batch = missingTopics.slice(0, limit);

  for (const topic of batch) {
    await ctx.db.insert("topics", topic);
  }

  return { seeded: batch.length, remaining: missingTopics.length - batch.length };
}

export const seedCurriculumBatch = mutation({
  args: { level: levelValidator, batchSize: v.optional(v.number()) },
  returns: v.object({ seeded: v.number(), remaining: v.number() }),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    return await seedLevelBatch(
      ctx,
      args.level,
      Math.max(1, Math.min(args.batchSize ?? MAX_TOPIC_BATCH_SIZE, MAX_TOPIC_BATCH_SIZE)),
    );
  },
});

export const ensureCurriculumSeeded = mutation({
  args: {},
  returns: v.object({ seeded: v.number(), remaining: v.number(), hasMore: v.boolean() }),
  handler: async (ctx) => {
    await requireUserId(ctx);
    let budget = MAX_TOPIC_BATCH_SIZE;
    let seeded = 0;
    let remaining = 0;

    for (const level of levels) {
      const result = await seedLevelBatch(ctx, level, budget);
      seeded += result.seeded;
      remaining += result.remaining;
      budget -= result.seeded;
      if (budget === 0) break;
    }

    if (budget > 0) {
      for (const level of levels) {
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_level_and_order", (q) => q.eq("level", level))
          .take(120);
        remaining += Math.max(0, getCurriculumForLevel(level).length - topics.length);
      }
    }

    return { seeded, remaining, hasMore: remaining > 0 };
  },
});

export const getTopicsByLevel = query({
  args: { level: levelValidator },
  returns: v.array(v.object({
    topic: topicSummaryValidator,
    status: topicStatusValidator,
    lastScore: v.union(v.null(), v.number()),
  })),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const [topics, progressRows] = await Promise.all([
      ctx.db.query("topics").withIndex("by_level_and_order", (q) => q.eq("level", args.level)).take(120),
      ctx.db.query("userTopicProgress").withIndex("by_user_and_level", (q) => q.eq("userId", userId).eq("level", args.level)).take(120),
    ]);
    const progressByTopic = new Map(progressRows.map((row) => [row.topicId, row]));

    return topics.map((topic) => {
      const progress = progressByTopic.get(topic._id);
      return {
        topic: toTopicSummary(topic),
        status: progress?.status ?? "not_started",
        lastScore: progress?.lastScore ?? null,
      };
    });
  },
});

export const getTopic = query({
  args: { topicId: v.id("topics") },
  returns: v.union(v.null(), topicSummaryValidator),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const topic = await ctx.db.get("topics", args.topicId);
    return topic ? toTopicSummary(topic) : null;
  },
});

export const getUserLevelProgress = query({
  args: {},
  returns: v.object({ levels: v.array(progressSummaryValidator) }),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const summaries = await Promise.all(levels.map(async (level) => {
      const [topics, progressRows] = await Promise.all([
        ctx.db.query("topics").withIndex("by_level_and_order", (q) => q.eq("level", level)).take(120),
        ctx.db.query("userTopicProgress").withIndex("by_user_and_level", (q) => q.eq("userId", userId).eq("level", level)).take(120),
      ]);
      const completedIds = new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.topicId));
      const completedTopics = topics.filter((topic) => completedIds.has(topic._id)).length;
      const nextTopic = topics.find((topic) => !completedIds.has(topic._id)) ?? null;
      return {
        level,
        totalTopics: topics.length,
        completedTopics,
        percentage: topics.length === 0 ? 0 : Math.round((completedTopics / topics.length) * 1000) / 10,
        nextTopic: nextTopic ? toTopicSummary(nextTopic) : null,
      };
    }));
    return { levels: summaries };
  },
});

export const completeTopic = mutation({
  args: { topicId: v.id("topics"), score: v.optional(v.number()) },
  returns: v.object({ alreadyCompleted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const topic = await ctx.db.get("topics", args.topicId);
    if (!topic) throw new Error("Topic not found");
    const existing = await ctx.db
      .query("userTopicProgress")
      .withIndex("by_user_and_topic", (q) => q.eq("userId", userId).eq("topicId", args.topicId))
      .unique();
    if (existing?.status === "completed") return { alreadyCompleted: true };
    const lastScore = args.score === undefined ? undefined : Math.max(0, Math.min(100, Math.round(args.score)));
    if (existing) {
      await ctx.db.patch("userTopicProgress", existing._id, { status: "completed", completedAt: Date.now(), lastScore });
    } else {
      await ctx.db.insert("userTopicProgress", { userId, topicId: topic._id, level: topic.level, status: "completed", completedAt: Date.now(), lastScore });
    }
    return { alreadyCompleted: false };
  },
});
