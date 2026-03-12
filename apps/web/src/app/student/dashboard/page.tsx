import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireStudent } from "@/lib/check-role";

import { StudentDashboardContent } from "./student-dashboard-content";

export default async function StudentDashboardPage() {
  await requireStudent();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <StudentDashboardContent user={session.user} />
    </div>
  );
}
