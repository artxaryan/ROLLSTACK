import { redirect } from "next/navigation";

import { getSession, requireProfessor } from "@/lib/check-role";

export default async function ProfessorSettingsPage() {
  await requireProfessor();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  redirect("/professor/dashboard" as never);
}
