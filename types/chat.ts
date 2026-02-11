export type Attachment = {
  name: string;
  mimeType: string;
  dataUrl: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: Attachment[];
  createdAt: number;
};

export type SessionSummary = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type MediaItem = {
  id: string;
  sessionId: string;
  kind: "image" | "video";
  prompt: string;
  url: string;
  createdAt: number;
};
