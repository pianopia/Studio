import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runMastraAgent } from "@/lib/agent/mastra-agent";

const attachmentSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  dataUrl: z.string()
});

const bodySchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1),
  attachments: z.array(attachmentSchema).default([])
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const input = bodySchema.parse(json);
    const result = await runMastraAgent(input.sessionId, input.message, input.attachments);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "チャット処理に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
