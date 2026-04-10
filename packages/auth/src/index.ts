import { BrevoClient } from "@getbrevo/brevo";
import { db } from "@sams-t-app/db";
import {
  account,
  session,
  user,
  verification,
} from "@sams-t-app/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  trustedOrigins: [process.env.CORS_ORIGIN ?? "http://localhost:3001"],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before(user, _context) {
          return Promise.resolve({
            data: {
              ...user,
              role: (user as { role?: string }).role || "student",
            },
          });
        },
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const brevoApiKey = process.env.BREVO_API_KEY;

        if (!brevoApiKey) {
          const errorMsg =
            "Email service not configured. Please contact support.";
          console.error("[Auth]", errorMsg);
          throw new Error(errorMsg);
        }

        const senderEmail = process.env.BREVO_SENDER_EMAIL;
        if (!senderEmail) {
          const errorMsg =
            "Email sender not configured. Please contact support.";
          console.error("[Auth]", errorMsg);
          throw new Error(errorMsg);
        }

        const senderName = "SAMS";

        let subject = "Your verification code";
        if (type === "sign-in") {
          subject = "Sign in to your account";
        } else if (type === "email-verification") {
          subject = "Verify your email";
        } else if (type === "forget-password") {
          subject = "Reset your password";
        }

        try {
          const brevoClient = new BrevoClient({ apiKey: brevoApiKey });

          console.log("[Auth] Sending OTP via Brevo:", {
            to: email,
            from: senderEmail,
            subject,
          });

          const response =
            await brevoClient.transactionalEmails.sendTransacEmail({
              subject,
              htmlContent: `<html><body><h2>Your OTP is: <strong>${otp}</strong></h2></body></html>`,
              textContent: `Your OTP is: ${otp}`,
              to: [{ email, name: email }],
              sender: { email: senderEmail, name: senderName },
            });

          console.log("[Auth] Brevo response:", JSON.stringify(response));
        } catch (error) {
          const err = error as {
            message?: string;
            code?: string;
            response?: unknown;
          };
          console.error("[Auth] Brevo error details:", {
            message: err.message,
            code: err.code,
            response: err.response,
          });
          const errorMsg =
            err.message ||
            `Failed to send email. Code: ${err.code || "unknown"}`;
          console.error("[Auth] Email send failed:", errorMsg);
          throw new Error(errorMsg);
        }
      },
    }),
  ],
});
