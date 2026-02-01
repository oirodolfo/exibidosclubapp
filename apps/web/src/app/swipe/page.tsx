import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { page, link } from "@/lib/variants";
import Link from "next/link";
import { SwipeFeed } from "./_components/SwipeFeed";

export default async function SwipePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/swipe");
  }

  if (process.env.FEATURE_SWIPE !== "true") {
    return (
      <main className={page.default}>
        <h1>Swipe</h1>
        <p>Swipe mode is disabled.</p>
        <p>
          <Link href="/" className={link}>Home</Link>
        </p>
      </main>
    );
  }

  return (
    <main className={page.default}>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-xl">Swipe</h1>
        <Link href="/" className={link}>Back</Link>
      </header>
      <SwipeFeed />
    </main>
  );
}
