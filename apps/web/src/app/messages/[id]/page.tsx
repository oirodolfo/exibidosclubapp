import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { page, link } from "@/lib/variants";
import Link from "next/link";
import { ConversationClient } from "./_components/ConversationClient";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/messages");
  }
  if (process.env.FEATURE_MESSAGING !== "true") {
    redirect("/messages");
  }
  const { id } = await params;
  return (
    <main className={page.default}>
      <p className="mb-4">
        <Link href="/messages" className={link}>← Messages</Link>
      </p>
      <ConversationClient conversationId={id} currentUserId={session.user.id} />
    </main>
  );
}
