/**
 * Marathi speech recognition built into the browser (Web Speech API). Chrome and Edge on Android and
 * desktop run it on Google's speech service at no cost and without an API key; Safari uses Apple's.
 * Text appears while the salesperson is still speaking. Used when the server has no Google key
 * (STT_PROVIDER=browser).
 */

interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternative;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isBrowserSpeechSupported(): boolean {
  return !!recognitionCtor();
}

export interface BrowserSpeechResult {
  text: string;
  /** Average confidence of the final phrases, when the browser reports one. */
  confidence: number | null;
}

export interface BrowserSpeechHandle {
  stop(): Promise<BrowserSpeechResult>;
  cancel(): void;
}

export class BrowserSpeechError extends Error {
  constructor(
    public readonly code: "UNSUPPORTED" | "PERMISSION_DENIED" | "NO_MIC" | "NETWORK" | "STT_FAILED",
    message: string,
  ) {
    super(message);
  }
}

const ERROR_CODES: Record<string, BrowserSpeechError["code"]> = {
  "not-allowed": "PERMISSION_DENIED",
  "service-not-allowed": "PERMISSION_DENIED",
  "audio-capture": "NO_MIC",
  network: "NETWORK",
};

/**
 * Starts listening in `lang` (mr-IN). `onText` receives the full text so far, including words still
 * being recognised, every time it changes. Phones end a session after a pause, so it restarts until
 * stop() is called and keeps everything said across restarts.
 */
export function startBrowserSpeech(
  lang: string,
  onText: (text: string) => void,
  onError?: (err: BrowserSpeechError) => void,
): BrowserSpeechHandle {
  const Ctor = recognitionCtor();
  if (!Ctor) throw new BrowserSpeechError("UNSUPPORTED", "This browser has no speech recognition.");

  const finals: string[] = [];
  const confidences: number[] = [];
  let interim = "";
  let stopping = false;
  let fatal: BrowserSpeechError | undefined;
  let finish: (() => void) | undefined;

  // Chrome on Android sometimes repeats earlier phrases or returns the whole text so far as each new
  // final result; keep only what is new.
  const addFinal = (phrase: string) => {
    const next = phrase.trim();
    const last = finals.at(-1)?.trim() ?? "";
    if (!next || next === last) return;
    if (last && next.startsWith(last)) finals[finals.length - 1] = next;
    else finals.push(next);
  };

  const current = () => [...finals, interim].map((s) => s.trim()).filter(Boolean).join(" ");

  const create = () => {
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alt = res[0];
        if (!alt) continue;
        if (res.isFinal) {
          addFinal(alt.transcript);
          if (alt.confidence > 0) confidences.push(alt.confidence);
        } else {
          interim += alt.transcript;
        }
      }
      onText(current());
    };
    rec.onerror = (e) => {
      // "no-speech" and "aborted" only mean a quiet pause or our own stop; keep going.
      if (e.error === "no-speech" || e.error === "aborted") return;
      fatal = new BrowserSpeechError(ERROR_CODES[e.error] ?? "STT_FAILED", `Speech recognition error: ${e.error}`);
    };
    rec.onend = () => {
      if (interim) {
        addFinal(interim);
        interim = "";
      }
      if (stopping || fatal) {
        if (finish) finish();
        else if (fatal) onError?.(fatal);
        return;
      }
      try {
        recognition = create();
        recognition.start();
      } catch {
        finish?.();
      }
    };
    return rec;
  };

  let recognition = create();
  recognition.start();

  return {
    cancel() {
      stopping = true;
      recognition.abort();
    },
    stop() {
      stopping = true;
      return new Promise<BrowserSpeechResult>((resolve, reject) => {
        const timeout = setTimeout(() => finish?.(), 3000);
        finish = () => {
          clearTimeout(timeout);
          finish = undefined;
          const text = current();
          if (fatal && !text) reject(fatal);
          else
            resolve({
              text,
              confidence: confidences.length ? confidences.reduce((s, c) => s + c, 0) / confidences.length : null,
            });
        };
        recognition.stop();
      });
    },
  };
}
