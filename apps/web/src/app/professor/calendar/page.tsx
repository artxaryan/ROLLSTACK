import { redirect } from "next/navigation";

import { getSession, requireProfessor } from "@/lib/check-role";

import { ProfessorCalendarContent } from "./professor-calendar-content";

export default async function ProfessorCalendarPage() {
  await requireProfessor();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <ProfessorCalendarContent user={session.user} />
    </div>
  );
}
