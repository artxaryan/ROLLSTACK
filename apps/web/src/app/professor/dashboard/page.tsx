import { redirect } from "next/navigation";

import { getSession, requireProfessor } from "@/lib/check-role";

import { ProfessorDashboardContent } from "./professor-dashboard-content";

export default async function ProfessorDashboardPage() {
  await requireProfessor();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <ProfessorDashboardContent user={session.user} />
    </div>
  );
}
