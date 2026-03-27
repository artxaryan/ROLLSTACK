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

interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwitchToSignIn: () => void;
}

export function SignUpForm({
  className,
  onSwitchToSignIn,
  ...props
}: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"student" | "professor">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { isPending: sessionPending } = authClient.useSession();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(email && name)) {
      return;
    }

    setIsLoading(true);
    try {
      const { exists } = await trpcClient.checkUserExists.query({ email });

      if (exists) {
        toast.error(
          "An account with this email already exists. Please sign in."
        );
        return;
      }

      // Store role temporarily for after verification
      sessionStorage.setItem("pendingSignupRole", role);
      sessionStorage.setItem("pendingSignupName", name);

      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send OTP");
        sessionStorage.removeItem("pendingSignupRole");
        sessionStorage.removeItem("pendingSignupName");
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
      const pendingName = sessionStorage.getItem("pendingSignupName") || name;
      const pendingRole = sessionStorage.getItem("pendingSignupRole") || role;

      // Sign in with OTP - this creates the user if they don't exist
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
        name: pendingName,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid OTP");
        return;
      }

      // Update role if needed (since default is "student")
      if (pendingRole === "professor") {
        try {
          await trpcClient.updateUserRole.mutate({ role: "professor" });
        } catch (roleError) {
          console.error("Failed to update role:", roleError);
        }
      }

      // Clear temporary storage
      sessionStorage.removeItem("pendingSignupRole");
      sessionStorage.removeItem("pendingSignupName");

      toast.success("Account created and verified!");
      window.location.href = "/dashboard";
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
            Create an account
          </CardTitle>
          <CardDescription className="modern-saas-description">
            {otpSent
              ? "Enter the OTP sent to your email"
              : "Enter your details and verify your email"}
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
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </Button>
                  <Button
                    className="glass-button w-full"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      sessionStorage.removeItem("pendingSignupRole");
                      sessionStorage.removeItem("pendingSignupName");
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
                    <Label className="form-label text-gray-200" htmlFor="name">
                      Name
                    </Label>
                    <div className="gradient-input-wrapper">
                      <Input
                        className="gradient-input"
                        id="name"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        type="text"
                        value={name}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="form-label mb-2 block text-gray-200">
                      I am a
                    </Label>
                    <div className="flex gap-3">
                      <button
                        className={`flex-1 rounded-lg border px-4 py-3 font-medium text-sm transition-all ${
                          role === "student"
                            ? "border-violet-500 bg-violet-500/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setRole("student");
                        }}
                        type="button"
                      >
                        Student
                      </button>
                      <button
                        className={`flex-1 rounded-lg border px-4 py-3 font-medium text-sm transition-all ${
                          role === "professor"
                            ? "border-violet-500 bg-violet-500/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setRole("professor");
                        }}
                        type="button"
                      >
                        Professor
                      </button>
                    </div>
                  </div>

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
                    disabled={!(email && name && role) || isLoading}
                    onClick={handleSendOtp}
                    type="submit"
                  >
                    {isLoading ? "Checking..." : "Continue"}
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
                onClick={onSwitchToSignIn}
                type="button"
                variant="outline"
              >
                Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignUpForm;
