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
        console.log("\n=== DEBUG: sendVerificationOTP called ===");
        console.log("Email:", email);
        console.log("OTP:", otp);
        console.log("Type:", type);
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY);
        console.log(
          "BREVO_API_KEY length:",
          process.env.BREVO_API_KEY?.length || 0
        );

        const brevoApiKey = process.env.BREVO_API_KEY;

        if (!brevoApiKey) {
          console.log(
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

        console.log("Sender email:", senderEmail);

        let subject = "Your verification code";
        if (type === "sign-in") {
          subject = "Sign in to your account";
        } else if (type === "email-verification") {
          subject = "Verify your email";
        } else if (type === "forget-password") {
          subject = "Reset your password";
        }

        console.log("Subject:", subject);

        try {
          console.log("[Auth] Creating Brevo client...");
          const brevoClient = new BrevoClient({ apiKey: brevoApiKey });

          console.log("[Auth] Sending email via Brevo...");
          const response =
            await brevoClient.transactionalEmails.sendTransacEmail({
              subject,
              htmlContent: `<html><body><h2>Your OTP is: <strong>${otp}</strong></h2></body></html>`,
              textContent: `Your OTP is: ${otp}`,
              to: [{ email, name: email }],
              sender: { email: senderEmail, name: senderName },
            });

          console.log(
            "[Auth] Brevo response:",
            JSON.stringify(response, null, 2)
          );
          console.log("[Auth] Email sent successfully!\n");
        } catch (error) {
          console.error("[Auth] Brevo error details:");
          console.error("Error name:", (error as Error).name);
          console.error("Error message:", (error as Error).message);
          console.error("Error stack:", (error as Error).stack);
          console.error("Full error:", error);
          throw error;
        }
      },
    }),
  ],
});
