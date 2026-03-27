"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0f]">
      <div className="absolute inset-0">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)",
            transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`,
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)",
            transform: `translate(${-mousePosition.x * 0.2}px, ${-mousePosition.y * 0.2}px)`,
            animation: "pulse 4s ease-in-out infinite 1s",
          }}
        />
        <div
          className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: `radial(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.3) 0%, transparent 60%)`,
            transform: `translate(${mousePosition.x * 0.1}px, ${-mousePosition.y * 0.1}px)`,
            animation: "pulse 4s ease-in-out infinite 2s",
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`,
            transform: `translate(${-mousePosition.x * 0.15}px, ${mousePosition.y * 0.1}px)`,
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiMyMDIyMzciIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-6 font-bold text-6xl text-white tracking-tight md:text-8xl">
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              SAMS
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-zinc-400 md:text-xl">
            Student Attendance Management System
          </p>
          <p className="mx-auto mb-12 max-w-lg text-base text-zinc-500">
            Streamline your classroom attendance with ease. Track, manage, and
            analyze student attendance all in one place.
          </p>
          <button
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 font-semibold text-white transition-all duration-300 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/25 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
            onClick={() => router.push("/login")}
            type="button"
          >
            <span>Get Started</span>
            <svg
              aria-hidden="true"
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17 8l4 4m0 0l-4 4m4-4H3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <span className="text-sm">Scroll to learn more</span>
            <div aria-hidden="true" className="h-6 w-6 animate-bounce">
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
