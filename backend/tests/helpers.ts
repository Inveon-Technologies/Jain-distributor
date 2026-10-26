import request from "supertest";
import { createApp } from "../src/app.js";
import { ensureAdmin } from "../src/db/bootstrap.js";
import { migrate } from "../src/db/migrate.js";
import { pool } from "../src/db/pool.js";
import { MockSpeechProvider } from "../src/modules/voice/providers.js";

export const MOCK_TRANSCRIPT = "दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स.";

export const app = createApp({ speechProvider: new MockSpeechProvider(MOCK_TRANSCRIPT) });
export const api = () => request(app);

/** Drops everything and re-applies migrations plus the bootstrap admin. */
export async function resetDatabase() {
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await migrate();
  await ensureAdmin();
}

export async function login(email: string, password: string): Promise<string> {
  const res = await api().post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token as string;
}

export const adminToken = () => login("admin@jain.com", "admin123");

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
