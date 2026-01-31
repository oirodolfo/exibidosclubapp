import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const HUMANPROOF_BASE =
  process.env.HUMANPROOF_SERVICE_URL ?? "http://localhost:4020";

/**
 * Next.js API Route: request a verification code from HumanProof Service.
 * POST /api/humanproof/verification/code
 * Body: { deviceFingerprint, sessionId, ipHash? } — userId injected from session.
 * Response: { code, expiresAt } or error JSON.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const base = HUMANPROOF_BASE.replace(/\/$/, "");
  const url = `${base}/verification/code`;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = {
      userId: session.user.id,
      deviceFingerprint: body.deviceFingerprint ?? "",
      sessionId: body.sessionId ?? crypto.randomUUID(),
      ipHash: body.ipHash ?? "",
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        data as { statusCode?: number; error?: string; message?: string },
        { status: res.status }
      );
    }
    return NextResponse.json(data as { code: string; expiresAt: string });
  } catch (e) {
    return NextResponse.json(
      {
        statusCode: 502,
        error: "Bad Gateway",
        message: "HumanProof service unavailable",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
