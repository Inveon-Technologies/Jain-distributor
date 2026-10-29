import { config } from "../../config.js";
import { HttpError } from "../../lib/errors.js";
import { parseOrderText } from "./parser.js";
import { buildSpeechContexts, type SpeechContext } from "./vocabulary.js";

export interface Transcription {
  text: string;
  confidence?: number;
  /** Words the recogniser was unsure about, for highlighting on the review screen. */
  lowConfidenceWords?: string[];
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

/**
 * Development / test provider: returns a fixed Marathi sentence whatever was said. It is never used
 * in production (see `createSpeechProvider`), so salespeople never get a made-up order.
 */
export class MockSpeechProvider implements SpeechProvider {
  readonly name = "mock";
  constructor(private readonly transcript: string) {}

  async transcribe(): Promise<Transcription> {
    return { text: this.transcript, confidence: 1, lowConfidenceWords: [], provider: this.name };
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

export interface GoogleSpeechOptions {
  /** Recognition model; "latest_long" is Google's most accurate v1 model for mr-IN dictation. */
  model?: string;
  /** Extra languages to auto-detect. Empty by default: mixing in hi-IN tends to produce Hindi spellings. */
  alternativeLanguageCodes?: string[];
  /** Phrase hints (product, brand and quantity words) and their boosts. */
  speechContexts?: SpeechContext[];
  /** Words recognised below this confidence are reported back so the review screen can flag them. */
  minWordConfidence?: number;
  fetchImpl?: typeof fetch;
}

interface GoogleWord {
  word?: string;
  confidence?: number;
}

interface GoogleAlternative {
  transcript?: string;
  confidence?: number;
  words?: GoogleWord[];
}

/**
 * Picks the alternative to use for one result. Google ranks alternatives acoustically; when a lower
 * ranked one reads as more complete order lines ("पाच किलो साखर" vs "पाच किलो सागर") we prefer it.
 */
export function pickAlternative(alternatives: GoogleAlternative[]): GoogleAlternative | undefined {
  const usable = alternatives.filter((a) => a.transcript?.trim());
  if (usable.length <= 1) return usable[0];
  const score = (a: GoogleAlternative) => {
    const parsed = parseOrderText(a.transcript!);
    const known = parsed.items.filter((i) => i.nameEn).length;
    return parsed.items.length * 2 + known - parsed.unparsed.length;
  };
  let best = usable[0];
  let bestScore = score(best);
  for (const alt of usable.slice(1)) {
    const s = score(alt);
    if (s > bestScore) {
      best = alt;
      bestScore = s;
    }
  }
  return best;
}

/**
 * Google Cloud Speech-to-Text (v1p1beta1 REST, synchronous recognize, up to ~60 s of audio)
 * with the Marathi (mr-IN) model. Authenticated with an API key restricted to the Speech API.
 *
 * Accuracy settings: the "latest_long" model, phrase boosting for kirana vocabulary, word-level
 * confidence and three alternatives that are re-ranked with the order parser. If Google rejects the
 * tuned request for this language (unsupported model or adaptation), it retries once with the
 * default model and no adaptation so a recording is never lost.
 */
export class GoogleSpeechProvider implements SpeechProvider {
  readonly name = "google";
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly apiKey: string,
    private readonly languageCode: string,
    private readonly options: GoogleSpeechOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async transcribe(audio: Buffer, mimeType: string, options: TranscribeOptions = {}): Promise<Transcription> {
    const encoding = googleEncoding(mimeType);
    const base = {
      languageCode: this.languageCode,
      enableAutomaticPunctuation: true,
      enableWordConfidence: true,
      maxAlternatives: 3,
      profanityFilter: false,
      audioChannelCount: 1,
      ...(encoding ? { encoding } : {}),
      ...(encoding === "WEBM_OPUS" || encoding === "OGG_OPUS"
        ? { sampleRateHertz: options.sampleRateHertz ?? 48000 }
        : {}),
    };
    const tuned = {
      ...base,
      ...(this.options.model ? { model: this.options.model } : {}),
      ...(this.options.alternativeLanguageCodes?.length
        ? { alternativeLanguageCodes: this.options.alternativeLanguageCodes }
        : {}),
      ...(this.options.speechContexts?.length ? { speechContexts: this.options.speechContexts } : {}),
    };
    const content = audio.toString("base64");

    let res = await this.recognize({ config: tuned, audio: { content } });
    if (res.status === 400 && JSON.stringify(tuned) !== JSON.stringify(base)) {
      res = await this.recognize({ config: base, audio: { content } });
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new HttpError(502, "STT_FAILED", `Speech-to-text request failed (${res.status})`, detail.slice(0, 500));
    }
    const json = (await res.json()) as { results?: { alternatives?: GoogleAlternative[] }[] };
    const best = (json.results ?? [])
      .map((r) => pickAlternative(r.alternatives ?? []))
      .filter((a): a is GoogleAlternative => !!a?.transcript);
    const text = best.map((a) => a.transcript!.trim()).join(" ").trim();

    const confidences = best.map((a) => a.confidence).filter((c): c is number => typeof c === "number" && c > 0);
    const threshold = this.options.minWordConfidence ?? 0;
    const lowConfidenceWords = best
      .flatMap((a) => a.words ?? [])
      .filter((w) => w.word && typeof w.confidence === "number" && w.confidence > 0 && w.confidence < threshold)
      .map((w) => w.word!.replace(/[.,!?।]+$/, ""));
    return {
      text,
      confidence: confidences.length ? confidences.reduce((s, c) => s + c, 0) / confidences.length : undefined,
      lowConfidenceWords: [...new Set(lowConfidenceWords)],
      provider: this.name,
    };
  }

  private recognize(body: unknown): Promise<Response> {
    return this.fetchImpl(
      `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      },
    );
  }
}

const csv = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Used in production when no real recogniser is configured: every request fails clearly. */
export class UnconfiguredSpeechProvider implements SpeechProvider {
  readonly name = "none";

  async transcribe(): Promise<Transcription> {
    throw new HttpError(
      503,
      "STT_NOT_CONFIGURED",
      "Speech-to-text is not set up on the server. Set STT_PROVIDER=google and GOOGLE_SPEECH_API_KEY.",
    );
  }
}

export function createSpeechProvider(): SpeechProvider {
  if (config.STT_PROVIDER === "google") {
    return new GoogleSpeechProvider(config.GOOGLE_SPEECH_API_KEY!, config.STT_LANGUAGE, {
      model: config.STT_MODEL || undefined,
      alternativeLanguageCodes: csv(config.STT_ALTERNATIVE_LANGUAGES),
      speechContexts: buildSpeechContexts(config.STT_PHRASE_BOOST, csv(config.STT_EXTRA_PHRASES)),
      minWordConfidence: config.STT_MIN_CONFIDENCE,
    });
  }
  if (config.NODE_ENV === "production") return new UnconfiguredSpeechProvider();
  return new MockSpeechProvider(config.MOCK_TRANSCRIPT);
}
