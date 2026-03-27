import { redirect } from "next/navigation";

import { getSession, requireStudent } from "@/lib/check-role";

export default async function StudentClassesPage() {
  await requireStudent();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  redirect("/student/dashboard" as never);
}
