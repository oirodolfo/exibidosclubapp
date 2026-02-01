import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const HUMANPROOF_BASE =
  process.env.HUMANPROOF_SERVICE_URL ?? "http://localhost:4020";

/**
 * GET /api/humanproof/status
 * Returns verification status for the current user (userId from session).
 * Proxies to HumanProof GET /verification/status/:userId.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const base = HUMANPROOF_BASE.replace(/\/$/, "");
  const url = `${base}/verification/status/${encodeURIComponent(session.user.id)}`;

  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        data as { statusCode?: number; message?: string },
        { status: res.status }
      );
    }

    return NextResponse.json(data as {
      userId: string;
      userVerificationStatus: string;
      devices: { deviceFingerprint: string; status: string; boundAt: string }[];
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Bad Gateway",
        message: "HumanProof service unavailable",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
