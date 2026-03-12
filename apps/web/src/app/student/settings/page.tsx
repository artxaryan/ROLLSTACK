import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireStudent } from "@/lib/check-role";

export default async function StudentSettingsPage() {
  await requireStudent();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="font-semibold text-2xl">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Settings page coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
