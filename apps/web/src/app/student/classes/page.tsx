import { redirect } from "next/navigation";

import { getSession, requireStudent } from "@/lib/check-role";

import { StudentClassesContent } from "./student-classes-content";

export default async function StudentClassesPage() {
  await requireStudent();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <StudentClassesContent user={session.user} />
    </div>
  );
}
