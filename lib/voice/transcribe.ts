import type { Recording } from "./recorder";

export interface TranscribeItem {
  name: string;
  nameEn?: string;
  quantity: number;
  unit: string;
  unitCode: string;
}

export interface TranscribeResult {
  text: string;
  confidence: number | null;
  needsReview: boolean;
  lowConfidenceWords: string[];
  provider: string;
  language: string;
  items: TranscribeItem[];
  unparsed: string[];
  summary: string;
}

export class TranscribeError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// Same base URL and token key as the app's API client (lib/api.ts).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
const TOKEN_KEY = "jd_token";

function authToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Uploads a recording to POST /voice/transcribe and returns the Marathi transcript and parsed items. */
export async function transcribeRecording(recording: Recording): Promise<TranscribeResult> {
  const form = new FormData();
  form.append("audio", recording.blob, "order.wav");
  form.append("sampleRate", String(recording.sampleRate));
  const token = authToken();
  const res = await fetch(`${API_BASE_URL}/voice/transcribe`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error ?? {};
    throw new TranscribeError(res.status, err.code ?? "STT_FAILED", err.message ?? `Request failed (${res.status})`);
  }
  return json.data as TranscribeResult;
}
