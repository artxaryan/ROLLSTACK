import { redirect } from "next/navigation";

import { getSession, requireStudent } from "@/lib/check-role";

import { StudentDashboardContent } from "./student-dashboard-content";

export default async function StudentDashboardPage() {
  await requireStudent();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <StudentDashboardContent user={session.user} />
    </div>
  );
}
