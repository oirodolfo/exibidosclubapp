import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { link } from "@/lib/variants";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <main className="mx-auto max-w-[480px] px-4 py-8">
      <h1>exibidos.club</h1>
      <p>Monorepo initialized.</p>
      {session?.user && process.env.FEATURE_SWIPE === "true" && (
        <p>
          <Link href="/swipe" className={link}>Swipe</Link>
        </p>
      )}
      {!session?.user && (
        <p>
          <Link href="/auth/login" className={link}>Login</Link>
        </p>
      )}
    </main>
  );
}
