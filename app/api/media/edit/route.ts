import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { renderEditedVideo } from "@/lib/remotion/render-edit";
import { saveMediaItem } from "@/lib/agent/mastra-agent";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  sourceUrl: z.string().min(1),
  sourceKind: z.enum(["image", "video"]),
  prompt: z.string().min(1),
  startSec: z.number().min(0),
  endSec: z.number().positive()
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const input = bodySchema.parse(json);

    const editedUrl = await renderEditedVideo({
      sourceUrl: input.sourceUrl,
      kind: input.sourceKind,
      startSec: input.startSec,
      endSec: input.endSec
    });

    const mediaItem = {
      id: uuidv4(),
      sessionId: input.sessionId,
      kind: "video" as const,
      prompt: `[Edited] ${input.prompt}`,
      url: editedUrl,
      createdAt: Date.now()
    };

    await saveMediaItem(mediaItem);

    return NextResponse.json({ mediaItem });
  } catch (error) {
    const message = error instanceof Error ? error.message : "編集動画の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
