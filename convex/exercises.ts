import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
      totalCount: v.number(), status: v.union(v.literal("active"), v.literal("completed")),
    }),
    exercises: v.array(v.any()),
  })),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const date = todayDateString();

    const session = await ctx.db
      .query("dailySessions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .unique();

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

    const existing = await ctx.db
      .query("dailySessions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .unique();

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
  returns: v.object({ alreadyCompleted: v.boolean(), score: v.optional(v.number()) }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const exercise = await ctx.db.get("exercises", args.exerciseId);

    if (!exercise || exercise.userId !== userId) {
      throw new Error("Exercise not found");
    }

    if (exercise.status === "completed") {
      return { alreadyCompleted: true };
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

    return { alreadyCompleted: false, score: clampedScore };
  },
});

export { computeScore, skillKeys };
