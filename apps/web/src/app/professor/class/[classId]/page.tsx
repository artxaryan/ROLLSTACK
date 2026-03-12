import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireProfessor } from "@/lib/check-role";

import { ClassDetailContent } from "./class-detail-content";

interface ClassPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  await requireProfessor();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { classId } = await params;

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <ClassDetailContent classId={classId} user={session.user} />
    </div>
  );
}
