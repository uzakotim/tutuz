import { Email } from "@convex-dev/auth/providers/Email";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

const passwordResetEmail = Email({
  id: "password-reset",
  from: "Tutuz <onboarding@resend.dev>",
  async sendVerificationRequest({ identifier, url, provider }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Password reset email is not configured yet");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: provider.from,
        to: [identifier],
        subject: "Reset your Tutuz password",
        html: `<p>We received a request to reset your Tutuz password.</p><p><a href="${url}">Choose a new password</a></p><p>This link expires soon. If you did not request this, you can ignore this email.</p>`,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not send password reset email");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: passwordResetEmail,
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string | undefined) ?? "",
        };
      },
    }),
  ],
});
