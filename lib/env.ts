import { z } from "zod";

const envSchema = z.object({
  ALLOWED_IPS: z.string().default("127.0.0.1,::1"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  GEMINI_IMAGE_MODEL: z.string().default("imagen-3.0-generate-002"),
  GEMINI_VIDEO_MODEL: z.string().default("veo-2.0-generate-001"),
  VIDEO_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  VIDEO_POLL_MAX_ATTEMPTS: z.coerce.number().int().positive().default(36),
  APP_ORIGIN: z.string().default("http://localhost:3000"),
  TURSO_DATABASE_URL: z.string().url().optional(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional()
});

export const env = envSchema.parse({
  ALLOWED_IPS: process.env.ALLOWED_IPS,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL,
  GEMINI_VIDEO_MODEL: process.env.GEMINI_VIDEO_MODEL,
  VIDEO_POLL_INTERVAL_MS: process.env.VIDEO_POLL_INTERVAL_MS,
  VIDEO_POLL_MAX_ATTEMPTS: process.env.VIDEO_POLL_MAX_ATTEMPTS,
  APP_ORIGIN: process.env.APP_ORIGIN,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN
});

export const getTursoConfig = () => {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を設定してください。");
  }
  return {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  };
};

export const allowedIpSet = new Set(
  env.ALLOWED_IPS.split(",")
    .map((ip) => ip.trim())
    .filter(Boolean)
);
