import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";

/**
 * Verify flow requires auth. Redirect to login if not signed in.
 * Does not block feed; only protects /verify.
 */
export default async function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/verify");
  }
  return <>{children}</>;
}
