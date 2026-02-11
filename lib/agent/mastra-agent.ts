import { v4 as uuidv4 } from "uuid";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureSchema } from "@/lib/db/bootstrap";
import { generateAssistantText, generateImage, generateVideo } from "@/lib/ai/gemini";
import { memoryStore } from "@/lib/memory/store";
import { generatedMedia, messages, sessions } from "@/lib/db/schema";
import type { Attachment, ChatMessage, MediaItem } from "@/types/chat";

const detectMediaCommand = (text: string): { kind: "image" | "video"; prompt: string } | null => {
  const lower = text.trim().toLowerCase();
  if (lower.startsWith("/image ")) {
    return { kind: "image", prompt: text.slice(7).trim() };
  }
  if (lower.startsWith("/video ")) {
    return { kind: "video", prompt: text.slice(7).trim() };
  }
  return null;
};

export const runMastraAgent = async (sessionId: string | undefined, userText: string, attachments: Attachment[]) => {
  await ensureSchema();
  const db = getDb();

  const session = memoryStore.getOrCreateSession(sessionId);
  const now = Date.now();

  const userMessage: ChatMessage = {
    id: uuidv4(),
    role: "user",
    content: userText,
    attachments,
    createdAt: now
  };
  memoryStore.addMessage(session.summary.id, userMessage);

  await db.insert(sessions).values(session.summary).onConflictDoUpdate({
    target: sessions.id,
    set: {
      title: session.summary.title,
      updatedAt: now
    }
  });

  await db.insert(messages).values({
    id: userMessage.id,
    sessionId: session.summary.id,
    role: userMessage.role,
    content: userMessage.content,
    attachmentsJson: JSON.stringify(attachments),
    createdAt: userMessage.createdAt
  });

  const mediaCommand = detectMediaCommand(userText);
  let mediaItem: MediaItem | null = null;
  let assistantText: string;

  if (mediaCommand) {
    const result =
      mediaCommand.kind === "image"
        ? await generateImage(mediaCommand.prompt)
        : await generateVideo(mediaCommand.prompt, attachments.find((attachment) => attachment.mimeType.startsWith("image/")));

    mediaItem = {
      id: uuidv4(),
      sessionId: session.summary.id,
      kind: mediaCommand.kind,
      prompt: mediaCommand.prompt,
      url: result.url,
      createdAt: Date.now()
    };

    await db.insert(generatedMedia).values(mediaItem);
    assistantText = `${mediaCommand.kind === "image" ? "画像" : "動画"}を生成しました: ${result.url}`;
  } else {
    assistantText = await generateAssistantText(userText, attachments);
  }

  const assistantMessage: ChatMessage = {
    id: uuidv4(),
    role: "assistant",
    content: assistantText,
    createdAt: Date.now()
  };
  memoryStore.addMessage(session.summary.id, assistantMessage);

  await db.insert(messages).values({
    id: assistantMessage.id,
    sessionId: session.summary.id,
    role: assistantMessage.role,
    content: assistantMessage.content,
    attachmentsJson: null,
    createdAt: assistantMessage.createdAt
  });

  await db
    .update(sessions)
    .set({
      title: session.summary.title,
      updatedAt: Date.now()
    })
    .where(eq(sessions.id, session.summary.id));

  return {
    sessionId: session.summary.id,
    messages: memoryStore.getMessages(session.summary.id),
    mediaItem
  };
};

export const listSessionSummaries = async () => {
  await ensureSchema();
  const db = getDb();
  return db.select().from(sessions).orderBy(desc(sessions.updatedAt));
};

export const listMessagesBySession = async (sessionId: string) => {
  await ensureSchema();
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt);
};

export const listMedia = async (sessionId?: string) => {
  await ensureSchema();
  const db = getDb();

  if (sessionId) {
    return db
      .select()
      .from(generatedMedia)
      .where(eq(generatedMedia.sessionId, sessionId))
      .orderBy(desc(generatedMedia.createdAt));
  }

  return db.select().from(generatedMedia).orderBy(desc(generatedMedia.createdAt));
};

export const saveMediaItem = async (item: MediaItem) => {
  await ensureSchema();
  const db = getDb();
  await db.insert(generatedMedia).values(item);
};
