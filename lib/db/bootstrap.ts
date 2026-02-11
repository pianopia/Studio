import { getClient } from "@/lib/db/client";

let bootstrapped = false;

export const ensureSchema = async () => {
  if (bootstrapped) {
    return;
  }

  const client = getClient();

  await client.execute(
    "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)"
  );
  await client.execute(
    "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, attachments_json TEXT, created_at INTEGER NOT NULL)"
  );
  await client.execute(
    "CREATE TABLE IF NOT EXISTS generated_media (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, kind TEXT NOT NULL, prompt TEXT NOT NULL, url TEXT NOT NULL, created_at INTEGER NOT NULL)"
  );

  bootstrapped = true;
};
