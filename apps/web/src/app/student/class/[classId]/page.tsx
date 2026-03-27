import { redirect } from "next/navigation";

import { getSession, requireStudent } from "@/lib/check-role";

import { StudentClassContent } from "./student-class-content";

interface StudentClassPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function StudentClassPage({
  params,
}: StudentClassPageProps) {
  await requireStudent();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  const { classId } = await params;

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <StudentClassContent classId={classId} />
    </div>
  );
}
