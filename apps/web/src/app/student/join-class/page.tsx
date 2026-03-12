import { auth } from "@sams-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { JoinClassForm } from "./join-class-form";

export default async function JoinClassPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <JoinClassForm />
    </div>
  );
}
