import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireProfessor } from "@/lib/check-role";

export default async function ProfessorCalendarPage() {
  await requireProfessor();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  redirect("/professor/dashboard");
}
