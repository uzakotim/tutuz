import {
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters");
    }

    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email;
    if (!email) {
      throw new Error("This account does not have an email address");
    }

    const { user } = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.currentPassword },
    });
    if (user._id !== userId) {
      throw new Error("Current password is incorrect");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword },
    });
    return null;
  },
});
