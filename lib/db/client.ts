import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getTursoConfig } from "@/lib/env";

let client: Client | null = null;
let db: LibSQLDatabase | null = null;

export const getClient = () => {
  if (!client) {
    client = createClient(getTursoConfig());
  }
  return client;
};

export const getDb = () => {
  if (!db) {
    db = drizzle(getClient());
  }
  return db;
};
