import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const HUMANPROOF_BASE =
  process.env.HUMANPROOF_SERVICE_URL ?? "http://localhost:4020";

/**
 * Next.js API Route: upload image for verification (metadata analysis) to HumanProof Service.
 * POST /api/humanproof/verification/upload
 * Body: multipart/form-data with file field. Requires auth.
 * Response: { accepted, failureReasons } or error JSON.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const base = HUMANPROOF_BASE.replace(/\/$/, "");
  const url = `${base}/verification/upload`;
  try {
    const contentType = req.headers.get("Content-Type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          statusCode: 400,
          error: "Bad Request",
          message: "Content-Type must be multipart/form-data",
        },
        { status: 400 }
      );
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: req.body,
      duplex: "half",
    } as RequestInit);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        data as { statusCode?: number; error?: string; message?: string },
        { status: res.status }
      );
    }
    return NextResponse.json(data as { accepted: boolean; failureReasons: string[] });
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
