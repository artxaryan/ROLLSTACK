"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

interface SessionUser {
  email: string;
  emailVerified: boolean;
  id: string;
  image?: string | null;
  name: string;
  role: string;
}

interface Session {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: SessionUser;
}

/**
 * Get session from auth API without importing server modules
 */
async function getSession(): Promise<Session | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(`${SERVER_URL}/api/auth/get-session`, {
      headers: {
        cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get the current user's role from the session
 * Returns null if no user is logged in
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.role ?? null;
}

/**
 * Check if current user is a professor
 */
export async function isProfessor(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "professor";
}

/**
 * Check if current user is a student
 */
export async function isStudent(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "student";
}

/**
 * Redirect to login if not authenticated
 */
export async function requireAuth(): Promise<void> {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }
}

/**
 * Require professor role - redirects students to student dashboard
 */
export async function requireProfessor(): Promise<void> {
  await requireAuth();

  const role = await getCurrentUserRole();
  if (role === "student") {
    redirect("/dashboard");
  }
}

/**
 * Require student role - redirects professors to professor dashboard
 */
export async function requireStudent(): Promise<void> {
  await requireAuth();

  const role = await getCurrentUserRole();
  if (role === "professor") {
    redirect("/professor/dashboard");
  }
}
