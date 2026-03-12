"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="fixed top-0 right-0 left-0 z-50 mx-6 mt-4">
      <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/70 px-6 py-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
        {/* Logo */}
        <Link
          className="font-pixel text-2xl text-foreground tracking-wider transition-colors hover:text-primary"
          href="/"
        >
          ROLLSTACK
        </Link>

        {/* Center Navigation */}
        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          {links.map(({ to, label }) => {
            return (
              <Link
                className="rounded-full px-5 py-2 font-medium text-foreground/80 text-sm transition-all hover:bg-white/50 hover:text-foreground hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:bg-white/10"
                href={to}
                key={to}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
