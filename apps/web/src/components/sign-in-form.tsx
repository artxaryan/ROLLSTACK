import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import Loader from "./loader";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwitchToSignUp: () => void;
}

export function LoginForm({
  className,
  onSwitchToSignUp,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { isPending: sessionPending } = authClient.useSession();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }

    setIsLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp(
        { email, type: "sign-in" },
        {
          onRequest: () => {
            setOtpSent(true);
            toast.success("OTP sent to your email");
          },
          onError: (ctx: { error: { message: string } }) => {
            toast.error(ctx.error.message || "Failed to send OTP");
          },
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(otp && email)) {
      return;
    }

    setIsLoading(true);
    try {
      await authClient.signIn.emailOtp(
        { email, otp },
        {
          onSuccess: () => {
            toast.success("Sign in successful");
            window.location.href = "/dashboard";
          },
          onError: (ctx: { error: { message: string } }) => {
            toast.error(ctx.error.message || "Invalid OTP");
          },
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionPending) {
    return <Loader />;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            {otpSent
              ? "Enter the OTP sent to your email"
              : "Login with your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              {otpSent ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      maxLength={6}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      type="text"
                      value={otp}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={otp.length !== 6 || isLoading}
                    onClick={handleVerifyOtp}
                    type="submit"
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Change email
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!email || isLoading}
                    onClick={handleSendOtp}
                    type="submit"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </>
              )}

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
                <span className="relative z-10 bg-card px-2 text-muted-foreground text-xs">
                  Or
                </span>
              </div>

              <Button
                className="w-full"
                onClick={onSwitchToSignUp}
                type="button"
                variant="outline"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { LoginForm as SignInForm };
