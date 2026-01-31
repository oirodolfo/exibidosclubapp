import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { FeedClient } from "./_components/FeedClient";

/**
 * Feed page: always accessible. Mobile-first.
 * Upload is gated by verification state (handled in UploadButton).
 */
export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/feed");
  }
  return (
    <main className="min-h-screen pb-24">
      <FeedClient />
    </main>
  );
}
