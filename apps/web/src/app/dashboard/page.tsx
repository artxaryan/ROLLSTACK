import { redirect } from "next/navigation";

import { isProfessor, isStudent } from "@/lib/check-role";

export default async function DashboardPage() {
  // Check user role and redirect accordingly
  const professor = await isProfessor();
  if (professor) {
    redirect("/professor/dashboard" as never);
  }

  const student = await isStudent();
  if (student) {
    redirect("/student/dashboard" as never);
  }

  // If no session/role, redirect to login
  redirect("/login" as never);
}
