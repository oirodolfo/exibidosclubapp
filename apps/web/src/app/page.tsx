import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { page, button } from "@/lib/variants";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <main className={page.default}>
      <div className="flex flex-col gap-8 pt-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-exibidos-ink">
            EXIBIDOS
          </h1>
          <p className="text-exibidos-ink-soft text-lg">
            Bold, playful, expressive. This is different.
          </p>
        </div>

        <Card variant="default" padding="lg" className="border-exibidos-purple/20">
          <p className="text-exibidos-ink-soft mb-4">
            {session?.user
              ? "You're in. Jump into your feed or discover."
              : "Join the club — dark mode, neon vibes, real people."}
          </p>
          <div className="flex flex-wrap gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/feed"
                  className={cn(button({ variant: "primary", size: "md" }))}
                >
                  Feed
                </Link>
                {process.env.FEATURE_SWIPE === "true" && (
                  <Link
                    href="/swipe"
                    className={cn(button({ variant: "secondary", size: "md" }))}
                  >
                    Swipe
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/auth/login"
                className={cn(button({ variant: "primary", size: "lg" }))}
              >
                Login
              </Link>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
