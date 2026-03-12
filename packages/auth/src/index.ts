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
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

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
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const isDev = process.env.NODE_ENV === "development";
        const from = isDev ? "onboarding@resend.dev" : "noreply@yourdomain.com";

        let subject = "Your verification code";
        if (type === "sign-in") {
          subject = "Sign in to your account";
        } else if (type === "email-verification") {
          subject = "Verify your email";
        } else if (type === "forget-password") {
          subject = "Reset your password";
        }

        try {
          await resend.emails.send({
            from,
            to: email,
            subject,
            html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
          });
        } catch (error) {
          console.error("Failed to send OTP email:", error);
          throw error;
        }
      },
    }),
  ],
});
