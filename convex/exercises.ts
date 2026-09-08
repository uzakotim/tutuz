import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  exerciseTypeValidator,
  levelValidator,
} from "./schema";
import { requireUserId } from "./lib/auth";

const skillKeys = [
  "vocabulary",
  "grammar",
  "listening",
  "reading",
  "writing",
  // Historical speaking exercises may still be scored if encountered.
  "speaking",
] as const;

type SkillKey = (typeof skillKeys)[number];

const topicCompletionValidator = v.union(v.null(), v.object({
  level: levelValidator,
  completedTopics: v.number(),
  totalTopics: v.number(),
  percentage: v.number(),
  nextTopic: v.union(v.null(), v.object({
    _id: v.id("topics"),
    level: levelValidator,
    order: v.number(),
    title: v.string(),
    titleUzbek: v.string(),
    category: v.string(),
    description: v.string(),
    keyVocabulary: v.array(v.object({ uzbek: v.string(), english: v.string() })),
    grammarFocus: v.string(),
  })),
}));

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function computeScore(correct: boolean, partial = false) {
  if (correct) return 100;
  if (partial) return 50;
  return 0;
}

export const getTodaySession = query({
  args: {},
  returns: v.union(v.null(), v.object({
    session: v.object({
      _id: v.id("dailySessions"), _creationTime: v.number(), userId: v.id("users"),
      date: v.string(), level: levelValidator, completedCount: v.number(),
      totalCount: v.number(), status: v.union(v.literal("active"), v.literal("completed")), topicId: v.optional(v.id("topics")),
    }),
    exercises: v.array(v.any()),
  })),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const date = todayDateString();

    const sessions = await ctx.db
      .query("dailySessions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .order("desc")
      .take(10);
    const session = sessions.find((candidate) => candidate.status === "active") ?? sessions[0];

    if (!session) {
      return null;
    }

    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    return { session, exercises };
  },
});

export const getExercise = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const exercise = await ctx.db.get("exercises", args.exerciseId);

    if (!exercise || exercise.userId !== userId) {
      return null;
    }

    return exercise;
  },
});

export const createDailySession = mutation({
  args: {
    level: levelValidator,
    topicId: v.optional(v.id("topics")),
    exercises: v.array(
      v.object({
        type: exerciseTypeValidator,
        title: v.string(),
        instructions: v.string(),
        content: v.any(),
      }),
    ),
  },
  returns: v.object({ sessionId: v.id("dailySessions"), exerciseIds: v.array(v.id("exercises")) }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const date = todayDateString();

    let existing;
    if (args.topicId) {
      const topicId = args.topicId;
      const topic = await ctx.db.get("topics", topicId);
      if (!topic || topic.level !== args.level) {
        throw new Error("Topic does not match this lesson level");
      }
      existing = await ctx.db
        .query("dailySessions")
        .withIndex("by_user_and_topic", (q) => q.eq("userId", userId).eq("topicId", topicId))
        .unique();

      const progress = await ctx.db
        .query("userTopicProgress")
        .withIndex("by_user_and_topic", (q) => q.eq("userId", userId).eq("topicId", topicId))
        .unique();
      if (!progress) {
        await ctx.db.insert("userTopicProgress", { userId, topicId, level: topic.level, status: "in_progress" });
      } else if (progress.status === "not_started") {
        await ctx.db.patch("userTopicProgress", progress._id, { status: "in_progress" });
      }
    } else {
      const sessions = await ctx.db
        .query("dailySessions")
        .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
        .order("desc")
        .take(10);
      existing = sessions[0];
    }

    if (existing) {
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_session", (q) => q.eq("sessionId", existing._id))
        .collect();
      return { sessionId: existing._id, exerciseIds: exercises.map((e) => e._id) };
    }

    const sessionId = await ctx.db.insert("dailySessions", {
      userId,
      date,
      level: args.level,
      completedCount: 0,
      totalCount: args.exercises.length,
      status: "active",
      topicId: args.topicId,
    });

    const exerciseIds = [];
    for (const exercise of args.exercises) {
      const id = await ctx.db.insert("exercises", {
        userId,
        sessionId,
        type: exercise.type,
        level: args.level,
        title: exercise.title,
        instructions: exercise.instructions,
        content: exercise.content,
        status: "pending",
        topicId: args.topicId,
      });
      exerciseIds.push(id);
    }

    return { sessionId, exerciseIds };
  },
});

export const submitExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    userAnswer: v.string(),
    score: v.number(),
    feedback: v.optional(v.string()),
  },
  returns: v.object({
    alreadyCompleted: v.boolean(),
    score: v.optional(v.number()),
    topicCompletion: topicCompletionValidator,
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const exercise = await ctx.db.get("exercises", args.exerciseId);

    if (!exercise || exercise.userId !== userId) {
      throw new Error("Exercise not found");
    }

    if (exercise.status === "completed") {
      return { alreadyCompleted: true, score: exercise.score, topicCompletion: null };
    }

    const clampedScore = Math.max(0, Math.min(100, Math.round(args.score)));

    await ctx.db.patch("exercises", args.exerciseId, {
      status: "completed",
      score: clampedScore,
      userAnswer: args.userAnswer,
      feedback: args.feedback,
      completedAt: Date.now(),
    });

    const session = await ctx.db.get("dailySessions", exercise.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const newCompletedCount = session.completedCount + 1;
    const sessionCompleted = newCompletedCount >= session.totalCount;

    await ctx.db.patch("dailySessions", session._id, {
      completedCount: newCompletedCount,
      status: sessionCompleted ? "completed" : "active",
    });

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      const xpGain = Math.round(clampedScore / 10);
      const skillKey = exercise.type as SkillKey;
      const updatedSkillXp = { ...profile.skillXp, [skillKey]: profile.skillXp[skillKey] + xpGain };

      const date = todayDateString();
      let streakDays = profile.streakDays;
      if (profile.lastActiveDate !== date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        streakDays =
          profile.lastActiveDate === yesterdayStr ? profile.streakDays + 1 : 1;
      }

      await ctx.db.patch("userProfiles", profile._id, {
        totalXp: profile.totalXp + xpGain,
        skillXp: updatedSkillXp,
        streakDays,
        lastActiveDate: date,
      });
    }

    let topicCompletion: {
      level: "A1" | "A2" | "B1" | "B2";
      completedTopics: number;
      totalTopics: number;
      percentage: number;
      nextTopic: {
        _id: Id<"topics">;
        level: "A1" | "A2" | "B1" | "B2";
        order: number;
        title: string;
        titleUzbek: string;
        category: string;
        description: string;
        keyVocabulary: Array<{ uzbek: string; english: string }>;
        grammarFocus: string;
      } | null;
    } | null = null;

    const completedTopicId = session.topicId;
    if (sessionCompleted && completedTopicId) {
      const topic = await ctx.db.get("topics", completedTopicId);
      if (topic) {
        const existingProgress = await ctx.db
          .query("userTopicProgress")
          .withIndex("by_user_and_topic", (q) => q.eq("userId", userId).eq("topicId", topic._id))
          .unique();
        const sessionExercises = await ctx.db
          .query("exercises")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .take(10);
        const completedExercises = sessionExercises.filter((item) => item.status === "completed");
        const topicScore = completedExercises.length === 0
          ? clampedScore
          : Math.round(completedExercises.reduce((sum, item) => sum + (item.score ?? 0), 0) / completedExercises.length);

        if (existingProgress) {
          await ctx.db.patch("userTopicProgress", existingProgress._id, {
            status: "completed",
            completedAt: Date.now(),
            lastScore: topicScore,
          });
        } else {
          await ctx.db.insert("userTopicProgress", {
            userId,
            topicId: topic._id,
            level: topic.level,
            status: "completed",
            completedAt: Date.now(),
            lastScore: topicScore,
          });
        }

        const [levelTopics, levelProgress] = await Promise.all([
          ctx.db.query("topics").withIndex("by_level_and_order", (q) => q.eq("level", topic.level)).take(120),
          ctx.db.query("userTopicProgress").withIndex("by_user_and_level", (q) => q.eq("userId", userId).eq("level", topic.level)).take(120),
        ]);
        const completedTopicIds = new Set(levelProgress.filter((item) => item.status === "completed").map((item) => item.topicId));
        completedTopicIds.add(topic._id);
        const completedTopics = levelTopics.filter((item) => completedTopicIds.has(item._id)).length;
        const nextTopic = levelTopics.find((item) => !completedTopicIds.has(item._id)) ?? null;
        topicCompletion = {
          level: topic.level,
          completedTopics,
          totalTopics: levelTopics.length,
          percentage: levelTopics.length === 0 ? 0 : Math.round((completedTopics / levelTopics.length) * 1000) / 10,
          nextTopic: nextTopic && {
            _id: nextTopic._id,
            level: nextTopic.level,
            order: nextTopic.order,
            title: nextTopic.title,
            titleUzbek: nextTopic.titleUzbek,
            category: nextTopic.category,
            description: nextTopic.description,
            keyVocabulary: nextTopic.keyVocabulary,
            grammarFocus: nextTopic.grammarFocus,
          },
        };
      }
    }

    return { alreadyCompleted: false, score: clampedScore, topicCompletion };
  },
});

export { computeScore, skillKeys };
