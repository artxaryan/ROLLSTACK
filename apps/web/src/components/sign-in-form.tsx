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
import { trpcClient } from "@/utils/trpc";
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
      const { exists } = await trpcClient.checkUserExists.query({ email });

      if (!exists) {
        toast.error("This user does not exist, please sign up");
        return;
      }

      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send OTP");
      } else {
        setOtpSent(true);
        toast.success("OTP sent to your email");
      }
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
      <Card className="glass-card relative overflow-hidden">
        <CardHeader className="modern-saas-header">
          <CardTitle className="modern-saas-title text-2xl">
            Welcome back
          </CardTitle>
          <CardDescription className="modern-saas-description">
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
                  <div>
                    <Label className="form-label text-gray-200" htmlFor="otp">
                      Enter OTP
                    </Label>
                    <div className="gradient-input-wrapper">
                      <Input
                        className="gradient-input"
                        id="otp"
                        maxLength={6}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        required
                        type="text"
                        value={otp}
                      />
                    </div>
                  </div>
                  <Button
                    className="shine-button w-full"
                    disabled={otp.length !== 6 || isLoading}
                    onClick={handleVerifyOtp}
                    type="submit"
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    className="glass-button w-full"
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
                  <div>
                    <Label className="form-label text-gray-200" htmlFor="email">
                      Email
                    </Label>
                    <div className="gradient-input-wrapper">
                      <Input
                        className="gradient-input"
                        id="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        required
                        type="email"
                        value={email}
                      />
                    </div>
                  </div>
                  <Button
                    className="shine-button w-full"
                    disabled={!email || isLoading}
                    onClick={handleSendOtp}
                    type="submit"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </>
              )}

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-white/10 border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0f0f1a] px-4 text-white/40">Or</span>
                </div>
              </div>

              <Button
                className="glass-button w-full"
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
export default LoginForm;
