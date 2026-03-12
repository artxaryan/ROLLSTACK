"use server";

import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current user's role from the session
 * Returns null if no user is logged in
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (session?.user?.role as string) ?? null;
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
