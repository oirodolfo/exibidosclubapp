import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { page, link } from "@/lib/variants";
import Link from "next/link";
import { GroupsClient } from "./_components/GroupsClient";

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/groups");
  }
  if (process.env.FEATURE_GROUPS !== "true") {
    return (
      <main className={page.default}>
        <h1>Groups</h1>
        <p>Groups are disabled.</p>
        <p>
          <Link href="/" className={link}>Home</Link>
        </p>
      </main>
    );
  }
  return (
    <main className={page.default}>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-xl">Groups</h1>
        <Link href="/" className={link}>Back</Link>
      </header>
      <GroupsClient />
    </main>
  );
}
