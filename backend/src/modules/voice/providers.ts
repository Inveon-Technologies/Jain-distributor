import { config } from "../../config.js";
import { HttpError } from "../../lib/errors.js";

export interface Transcription {
  text: string;
  confidence?: number;
  provider: string;
}

export interface SpeechProvider {
  readonly name: string;
  transcribe(audio: Buffer, mimeType: string, options?: TranscribeOptions): Promise<Transcription>;
}

export interface TranscribeOptions {
  /** Sample rate reported by the browser's AudioContext; Opus recordings default to 48 kHz. */
  sampleRateHertz?: number;
}

/** Development / demo provider: returns a fixed Marathi sentence (or the client-supplied hint). */
export class MockSpeechProvider implements SpeechProvider {
  readonly name = "mock";
  constructor(private readonly transcript: string) {}

  async transcribe(): Promise<Transcription> {
    return { text: this.transcript, confidence: 1, provider: this.name };
  }
}

/** Maps browser MediaRecorder MIME types to Google Speech-to-Text encodings. */
export function googleEncoding(mimeType: string): string | undefined {
  const mime = mimeType.toLowerCase();
  if (mime.includes("webm")) return "WEBM_OPUS";
  if (mime.includes("ogg")) return "OGG_OPUS";
  if (mime.includes("flac")) return "FLAC";
  if (mime.includes("wav") || mime.includes("x-wav")) return undefined; // read from the WAV header
  if (mime.includes("mpeg") || mime.includes("mp3")) return "MP3";
  throw new HttpError(415, "UNSUPPORTED_AUDIO", `Unsupported audio type ${mimeType}. Use webm/opus, ogg, wav, flac or mp3.`);
}

/**
 * Google Cloud Speech-to-Text (v1p1beta1 REST, synchronous recognize, up to ~60 s of audio)
 * with the Marathi (mr-IN) model. Authenticated with an API key restricted to the Speech API.
 */
export class GoogleSpeechProvider implements SpeechProvider {
  readonly name = "google";
  constructor(
    private readonly apiKey: string,
    private readonly languageCode: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async transcribe(audio: Buffer, mimeType: string, options: TranscribeOptions = {}): Promise<Transcription> {
    const encoding = googleEncoding(mimeType);
    const body = {
      config: {
        languageCode: this.languageCode,
        alternativeLanguageCodes: ["hi-IN", "en-IN"],
        enableAutomaticPunctuation: true,
        ...(encoding ? { encoding } : {}),
        ...(encoding === "WEBM_OPUS" || encoding === "OGG_OPUS"
          ? { sampleRateHertz: options.sampleRateHertz ?? 48000 }
          : {}),
      },
      audio: { content: audio.toString("base64") },
    };

    const res = await this.fetchImpl(
      `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new HttpError(502, "STT_FAILED", `Speech-to-text request failed (${res.status})`, detail.slice(0, 500));
    }
    const json = (await res.json()) as {
      results?: { alternatives?: { transcript?: string; confidence?: number }[] }[];
    };
    const best = (json.results ?? []).map((r) => r.alternatives?.[0]).filter((a) => a?.transcript);
    const text = best.map((a) => a!.transcript!.trim()).join(" ").trim();
    const confidences = best.map((a) => a!.confidence).filter((c): c is number => typeof c === "number");
    return {
      text,
      confidence: confidences.length ? confidences.reduce((s, c) => s + c, 0) / confidences.length : undefined,
      provider: this.name,
    };
  }
}

export function createSpeechProvider(): SpeechProvider {
  if (config.STT_PROVIDER === "google") {
    return new GoogleSpeechProvider(config.GOOGLE_SPEECH_API_KEY!, config.STT_LANGUAGE);
  }
  return new MockSpeechProvider(config.MOCK_TRANSCRIPT);
}
