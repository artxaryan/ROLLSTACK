"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { SignInForm } from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

function LoginForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [showSignIn, setShowSignIn] = useState(mode !== "signup");
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setMousePosition({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f0f1a]">
      <div className="absolute inset-0">
        <div
          className="absolute h-80 w-80 animate-pulse rounded-full blur-3xl"
          style={{
            top: "-10%",
            left: "-10%",
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
          }}
        />
        <div
          className="absolute h-80 w-80 animate-pulse rounded-full blur-3xl"
          style={{
            bottom: "-10%",
            right: "-10%",
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)",
            transform: `translate(${-mousePosition.x * 0.2}px, ${-mousePosition.y * 0.2}px)`,
          }}
        />
        <div
          className="absolute h-60 w-60 animate-pulse rounded-full blur-3xl"
          style={{
            top: "40%",
            left: "30%",
            background: `radial(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(139, 92, 246, 0.3) 0%, transparent 60%)`,
            animationDelay: "2s",
            transform: `translate(${mousePosition.x * 0.15}px, ${-mousePosition.y * 0.15}px)`,
          }}
        />
        <div
          className="absolute h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{
            top: "20%",
            right: "20%",
            background: `radial(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)`,
            transform: `translate(${-mousePosition.x * 0.25}px, ${mousePosition.y * 0.1}px)`,
          }}
        />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f1a]" />}>
      <LoginForm />
    </Suspense>
  );
}
