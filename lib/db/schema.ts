import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull()
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  attachmentsJson: text("attachments_json"),
  createdAt: integer("created_at").notNull()
});

export const generatedMedia = sqliteTable("generated_media", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  createdAt: integer("created_at").notNull()
});
