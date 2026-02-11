import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, SessionSummary } from "@/types/chat";

export type SessionState = {
  summary: SessionSummary;
  messages: ChatMessage[];
};

const sessions = new Map<string, SessionState>();

export const memoryStore = {
  listSessions: () =>
    Array.from(sessions.values())
      .map((session) => session.summary)
      .sort((a, b) => b.updatedAt - a.updatedAt),

  getOrCreateSession: (sessionId?: string) => {
    if (sessionId && sessions.has(sessionId)) {
      return sessions.get(sessionId)!;
    }

    const id = sessionId ?? uuidv4();
    const now = Date.now();
    const summary: SessionSummary = {
      id,
      title: "New Chat",
      createdAt: now,
      updatedAt: now
    };
    const state: SessionState = { summary, messages: [] };
    sessions.set(id, state);
    return state;
  },

  addMessage: (sessionId: string, message: ChatMessage) => {
    const state = memoryStore.getOrCreateSession(sessionId);
    state.messages.push(message);
    if (state.messages.length === 1 && message.role === "user") {
      state.summary.title = message.content.slice(0, 32) || "New Chat";
    }
    state.summary.updatedAt = Date.now();
  },

  getMessages: (sessionId: string) => {
    return memoryStore.getOrCreateSession(sessionId).messages;
  }
};
