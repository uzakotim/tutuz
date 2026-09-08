import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { levelValidator } from "./schema";
import { requireUserId } from "./lib/auth";

const defaultSkillXp = {
  vocabulary: 0,
  grammar: 0,
  listening: 0,
  reading: 0,
  writing: 0,
  speaking: 0,
};

export const currentProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("userProfiles"),
      _creationTime: v.number(),
      userId: v.id("users"),
      currentLevel: levelValidator,
      displayName: v.optional(v.string()),
      streakDays: v.number(),
      lastActiveDate: v.optional(v.string()),
      totalXp: v.number(),
      skillXp: v.object({
        vocabulary: v.number(), grammar: v.number(), listening: v.number(),
        reading: v.number(), writing: v.number(), speaking: v.number(),
      }),
      email: v.union(v.string(), v.null()),
      name: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const user = await ctx.db.get("users", userId);

    return profile
      ? { ...profile, email: user?.email ?? null, name: user?.name ?? null }
      : null;
  },
});

export const ensureProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
  },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      currentLevel: "A1",
      displayName: args.displayName,
      streakDays: 0,
      totalXp: 0,
      skillXp: defaultSkillXp,
    });
  },
});

export const updateLevel = mutation({
  args: {
    level: levelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch("userProfiles", profile._id, {
      currentLevel: args.level,
    });
    return null;
  },
});

export const updateDisplayName = mutation({
  args: {
    displayName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch("userProfiles", profile._id, {
      displayName: args.displayName,
    });

    await ctx.db.patch("users", userId, { name: args.displayName });
    return null;
  },
});
