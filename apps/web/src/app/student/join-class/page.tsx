import { redirect } from "next/navigation";

import { getSession } from "@/lib/check-role";

import { JoinClassForm } from "./join-class-form";

export default async function JoinClassPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login" as never);
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <JoinClassForm />
    </div>
  );
}
