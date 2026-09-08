import { convexAuth } from "@convex-dev/auth/server";
import type { EmailConfig } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const passwordResetEmail: EmailConfig = {
  id: "password-reset",
  type: "email",
  name: "Password reset",
  from: process.env.AUTH_RESEND_FROM,
  maxAge: 15 * 60,
  authorize: async (params, account) => {
    if (typeof params.email !== "string" || account.providerAccountId !== params.email) {
      throw new Error("The reset email does not match this account");
    }
  },
  sendVerificationRequest: async ({ identifier, url }) => {
    const apiKey = process.env.AUTH_RESEND_KEY;
    const from = process.env.AUTH_RESEND_FROM;
    if (!apiKey || !from) {
      throw new Error("Password reset email requires AUTH_RESEND_KEY and AUTH_RESEND_FROM");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: identifier,
        subject: "Reset your Retro Retro password",
        html: `<p>Use the link below to choose a new Retro Retro password.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 15 minutes.</p>`,
        text: `Use this link to choose a new Retro Retro password: ${url}\n\nThis link expires in 15 minutes.`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Could not send password reset email: ${await response.text()}`);
    }
  },
};

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      reset: passwordResetEmail,
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
});
