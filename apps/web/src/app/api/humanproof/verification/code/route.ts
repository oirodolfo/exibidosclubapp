import { NextResponse } from "next/server";

const HUMANPROOF_BASE =
  process.env.HUMANPROOF_SERVICE_URL ?? "http://localhost:4020";

/**
 * Next.js API Route: request a verification code from HumanProof Service.
 * POST /api/humanproof/verification/code
 * Body: { userId, deviceFingerprint, sessionId, ipHash? }
 * Response: { code, expiresAt } or error JSON.
 */
export async function POST(req: Request) {
  const base = HUMANPROOF_BASE.replace(/\/$/, "");
  const url = `${base}/verification/code`;
  try {
    const body = await req.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
