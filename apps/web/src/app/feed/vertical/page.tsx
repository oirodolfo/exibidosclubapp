import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { VerticalFeedClient } from "./_components/VerticalFeedClient";

export default async function VerticalFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/feed/vertical");
  }
  if (process.env.FEATURE_SWIPE !== "true") {
    redirect("/feed");
  }
  return (
    <main className="min-h-screen">
      <VerticalFeedClient />
    </main>
  );
}
