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
          console.warn(
            "[Auth] BREVO_API_KEY not set. OTP would be sent to:",
            email,
            "OTP:",
            otp
          );
          return;
        }

        const senderEmail =
          process.env.BREVO_SENDER_EMAIL || "noreply@yourdomain.com";
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

          await brevoClient.transactionalEmails.sendTransacEmail({
            subject,
            htmlContent: `<html><body><h2>Your OTP is: <strong>${otp}</strong></h2></body></html>`,
            textContent: `Your OTP is: ${otp}`,
            to: [{ email, name: email }],
            sender: { email: senderEmail, name: senderName },
          });
        } catch (error) {
          console.error("[Auth] Failed to send email:", error);
          throw error;
        }
      },
    }),
  ],
});
