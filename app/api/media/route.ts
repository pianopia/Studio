import { NextRequest, NextResponse } from "next/server";
import { listMedia } from "@/lib/agent/mastra-agent";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId") ?? undefined;
  const media = await listMedia(sessionId);
  return NextResponse.json({ media });
}
