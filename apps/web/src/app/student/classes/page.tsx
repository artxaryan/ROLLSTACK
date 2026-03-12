import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireStudent } from "@/lib/check-role";

export default async function StudentClassesPage() {
  await requireStudent();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  redirect("/student/dashboard");
}
