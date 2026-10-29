import "dotenv/config";
import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(6).optional(),
    ADMIN_NAME: z.string().default("प्रशासक"),
    STT_PROVIDER: z.enum(["mock", "google", "elevenlabs", "browser"]).default("mock"),
    STT_LANGUAGE: z.string().default("mr-IN"),
    GOOGLE_SPEECH_API_KEY: z.string().optional(),
    ELEVENLABS_API_KEY: z.string().optional(),
    ELEVENLABS_MODEL: z.string().default("scribe_v2"),
    STT_MODEL: z.string().default("latest_long"),
    STT_ALTERNATIVE_LANGUAGES: z.string().default(""),
    STT_PHRASE_BOOST: z.coerce.number().min(0).max(20).default(12),
    STT_EXTRA_PHRASES: z.string().default(""),
    STT_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.7),
    MOCK_TRANSCRIPT: z
      .string()
      .default("दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स."),
    MAX_AUDIO_MB: z.coerce.number().positive().default(10),
    BUSINESS_TZ_OFFSET_MINUTES: z.coerce.number().int().default(330),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
      ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "must be at least 32 characters in production" });
    }
    if (env.STT_PROVIDER === "elevenlabs" && !env.ELEVENLABS_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["ELEVENLABS_API_KEY"], message: "required when STT_PROVIDER=elevenlabs" });
    }
    if (env.STT_PROVIDER === "google" && !env.GOOGLE_SPEECH_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["GOOGLE_SPEECH_API_KEY"], message: "required when STT_PROVIDER=google" });
    }
  });

export type Config = z.infer<typeof schema>;

function load(): Config {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const config = load();

export const corsOrigins = config.CORS_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
