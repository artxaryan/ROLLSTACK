import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireProfessor } from "@/lib/check-role";

import { ProfessorDashboardContent } from "./professor-dashboard-content";

export default async function ProfessorDashboardPage() {
  await requireProfessor();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <ProfessorDashboardContent user={session.user} />
    </div>
  );
}
