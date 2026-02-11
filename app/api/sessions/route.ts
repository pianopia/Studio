import { NextRequest, NextResponse } from "next/server";
import { listMessagesBySession, listSessionSummaries } from "@/lib/agent/mastra-agent";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (sessionId) {
    const messages = await listMessagesBySession(sessionId);
    return NextResponse.json({ messages });
  }

  const sessions = await listSessionSummaries();
  return NextResponse.json({ sessions });
}
