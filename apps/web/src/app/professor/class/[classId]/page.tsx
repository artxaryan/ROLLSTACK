import { redirect } from "next/navigation";

import { getSession, requireProfessor } from "@/lib/check-role";

import { ClassDetailContent } from "./class-detail-content";

interface ClassPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  await requireProfessor();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  const { classId } = await params;

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <ClassDetailContent classId={classId} />
    </div>
  );
}
