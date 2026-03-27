import { redirect } from "next/navigation";

import { getSession, requireProfessor } from "@/lib/check-role";

import { ProfessorClassesContent } from "./professor-classes-content";

export default async function ProfessorClassesPage() {
  await requireProfessor();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <ProfessorClassesContent user={session.user} />
    </div>
  );
}
