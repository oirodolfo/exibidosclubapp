import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { page, link } from "@/lib/variants";
import Link from "next/link";
import { MessagesClient } from "./_components/MessagesClient";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/messages");
  }
  if (process.env.FEATURE_MESSAGING !== "true") {
    return (
      <main className={page.default}>
        <h1>Messages</h1>
        <p>Messaging is disabled.</p>
        <p>
          <Link href="/" className={link}>Home</Link>
        </p>
      </main>
    );
  }
  return (
    <main className={page.default}>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-xl">Messages</h1>
        <Link href="/" className={link}>Back</Link>
      </header>
      <MessagesClient />
    </main>
  );
}
