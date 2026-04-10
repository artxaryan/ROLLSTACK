"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

type Step = "email" | "verify";

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { isPending: sessionPending } = authClient.useSession();

  const handleSendOtp = async () => {
    if (!email) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (error) {
        toast.error(error.message || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your email!");
      setStep("verify");
    } catch (_err) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!(otp && email)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (error) {
        toast.error(error.message || "Invalid OTP");
        return;
      }

      toast.success("Sign in successful!");
      window.location.href = "/dashboard";
    } catch (_err) {
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (error) {
        toast.error(error.message || "Failed to resend OTP");
        return;
      }

      toast.success("OTP resent to your email!");
    } catch (_err) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionPending) {
    return <Loader />;
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl" />

      <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <svg
              aria-label="Login icon"
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h1 className="font-bold text-2xl text-slate-900 dark:text-slate-100">
            {step === "email" ? "Welcome Back" : "Verify Email"}
          </h1>
          <p className="mt-2 text-slate-600 text-sm dark:text-slate-400">
            {step === "email"
              ? "Sign in to your account - No password needed!"
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div
            className={`h-2 w-8 rounded-full transition-all duration-300 ${
              step === "email" ? "bg-indigo-500" : "bg-indigo-500"
            }`}
          />
          <div
            className={`h-2 w-8 rounded-full transition-all duration-300 ${
              step === "verify"
                ? "bg-indigo-500"
                : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        </div>

        {step === "email" ? (
          /* Step 1: Email */
          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="email"
              >
                Email Address
              </Label>
              <div className="relative">
                <svg
                  aria-label="Email"
                  className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <Input
                  className="rounded-full border-slate-200 bg-slate-50 pl-10 transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <Button
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 font-medium text-white shadow-indigo-500/25 shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/40"
              disabled={isLoading || !email}
              onClick={handleSendOtp}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    aria-label="Loading spinner"
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <svg
                    aria-label="Arrow right"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </span>
              )}
            </Button>
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="otp"
              >
                Verification Code
              </Label>
              <div className="relative">
                <svg
                  aria-label="Lock"
                  className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <Input
                  className="rounded-full border-slate-200 bg-slate-50 pl-10 text-center font-mono text-lg tracking-[0.5em] transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
                  id="otp"
                  maxLength={6}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  type="text"
                  value={otp}
                />
              </div>
            </div>

            <Button
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 font-medium text-white shadow-indigo-500/25 shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/40"
              disabled={isLoading || otp.length !== 6}
              onClick={handleVerifyOtp}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    aria-label="Loading spinner"
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify & Sign In"
              )}
            </Button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                className="text-indigo-600 text-sm hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                disabled={isLoading}
                onClick={handleResendOtp}
                type="button"
              >
                Resend OTP
              </button>
              <button
                className="text-slate-500 text-sm hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                disabled={isLoading}
                onClick={() => setStep("email")}
                type="button"
              >
                Change email
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-slate-200 border-t pt-6 text-center dark:border-slate-800">
          <p className="text-slate-600 text-sm dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <button
              className="font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={onSwitchToSignUp}
              type="button"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Trust badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <svg
            aria-label="Shield"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          <span>Secure OTP authentication</span>
        </div>
      </div>
    </div>
  );
}
