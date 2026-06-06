import { NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/health`, {
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
