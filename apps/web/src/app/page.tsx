"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const title = "ROLLSTACK";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track attendance patterns with powerful dashboards and insights",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Automated class schedules with intelligent calendar integration",
  },
  {
    icon: Users,
    title: "Student Management",
    description:
      "Effortlessly manage enrollments, roll numbers, and student profiles",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security with role-based access control",
  },
  {
    icon: BookOpen,
    title: "Attendance Tracking",
    description:
      "Mark and track attendance with just a few clicks. Never miss a record",
  },
  {
    icon: GraduationCap,
    title: "Professor Dashboard",
    description: "Complete control over your classes, students, and reports",
  },
];

const problemsSolved = [
  {
    title: "No More Paper Registers",
    description:
      "Eliminate handwritten attendance sheets. Digital records are instant, searchable, and never lost.",
  },
  {
    title: "Save Hours Every Week",
    description:
      "Mark attendance in seconds, not minutes. Generate reports with a single click.",
  },
  {
    title: "Never Lose Student Data",
    description:
      "All attendance records are securely stored in the cloud. Access them from anywhere, anytime.",
  },
  {
    title: "Know Your Class Better",
    description:
      "Visual analytics show attendance trends, helping you identify struggling students early.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Account",
    description:
      "Sign up as a professor and create your institution profile in seconds",
  },
  {
    step: "02",
    title: "Add Classes & Students",
    description:
      "Import or add students, create classes, and set up schedules effortlessly",
  },
  {
    step: "03",
    title: "Start Tracking",
    description:
      "Mark attendance with one click. View analytics and generate reports instantly",
  },
];

export default function Home() {
  const router = useRouter();
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < title.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev: string) => prev + title[index]);
        setIndex(index + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <div className="relative min-h-[calc(100vh-65px)] w-full overflow-x-hidden pb-12">
      {/* Hero Section */}
      <section className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center px-4 pt-8">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm text-violet-300">
              Reduce the Attendance hassle
            </span>
          </div>

          <h1 className="mb-12 font-bold text-5xl text-foreground tracking-tight md:text-8xl lg:text-9xl">
            {displayedText}
          </h1>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-all hover:shadow-lg hover:brightness-110"
              onClick={() => router.push("/login?mode=signup")}
              type="button"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-medium text-foreground transition-all hover:bg-accent"
              onClick={() => router.push("/login")}
              type="button"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Problems Solved Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-semibold text-2xl text-foreground md:text-3xl">
              Why Educators Choose{" "}
              <span className="text-primary">ROLLSTACK</span>
            </h2>
            <p className="text-muted-foreground">
              We solve the everyday problems that waste your time
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {problemsSolved.map((problem) => (
              <div
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
                key={problem.title}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {problem.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-semibold text-2xl text-foreground md:text-3xl">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div className="relative text-center" key={item.step}>
                <div className="mb-4 font-bold text-6xl text-primary/20">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-foreground text-lg">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
                {index < 2 && (
                  <div className="absolute top-4 hidden md:right-[-1.5rem] md:block">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-semibold text-2xl text-foreground md:text-3xl">
              Powerful Features
            </h2>
            <p className="text-muted-foreground">
              Everything you need to manage attendance effortlessly
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
                key={feature.title}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-indigo-500/5 p-8 text-center md:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />

            <div className="relative z-10">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="mb-4 font-semibold text-2xl text-foreground md:text-3xl">
                Ready to transform your attendance management?
              </h2>
              <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
                Join thousands of educational institutions already using
                ROLLSTACK to streamline their operations.
              </p>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-3 font-semibold text-background transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                onClick={() => router.push("/login?mode=signup")}
                type="button"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
