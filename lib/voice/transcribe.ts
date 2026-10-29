import { API_BASE_URL, getAuthToken } from "@/lib/api";
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
  /** One item per line with digit quantities ("रवा 1 किलो"), shown in the editable box. */
  formattedText?: string;
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

/** Uploads a recording to POST /voice/transcribe and returns the Marathi transcript and parsed items. */
export async function transcribeRecording(recording: Recording): Promise<TranscribeResult> {
  const form = new FormData();
  form.append("audio", recording.blob, "order.wav");
  form.append("sampleRate", String(recording.sampleRate));
  const token = getAuthToken();
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
