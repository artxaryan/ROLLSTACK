import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isProfessor, isStudent } from "@/lib/check-role";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect based on user role
  if (await isProfessor()) {
    redirect("/professor/dashboard");
  }

  if (await isStudent()) {
    redirect("/student/dashboard");
  }

  // Fallback - if role is unknown, redirect to login
  redirect("/login");
}
