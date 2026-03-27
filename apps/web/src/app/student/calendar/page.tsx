import { redirect } from "next/navigation";

import { getSession, requireStudent } from "@/lib/check-role";

export default async function StudentCalendarPage() {
  await requireStudent();

  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="font-semibold text-2xl">Calendar</h1>
          <p className="mt-2 text-muted-foreground">
            Calendar view coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
