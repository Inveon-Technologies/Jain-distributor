/**
 * Microphone capture tuned for Marathi speech-to-text in noisy shops.
 *
 * 1. The browser's own noise suppression, echo cancellation and auto gain run on the mic stream.
 * 2. A Web Audio chain removes rumble below 90 Hz (fans, traffic, handling noise) and content above
 *    7.6 kHz (hiss, and anything that would alias when downsampling), then evens out loud and soft
 *    syllables with a gentle compressor.
 * 3. On stop, leading/trailing silence is trimmed, the level is normalised and the audio is encoded
 *    as 16 kHz mono 16-bit WAV, the lossless format Google recommends for best accuracy.
 */

export const TARGET_SAMPLE_RATE = 16000;
/** Google's synchronous recognize accepts up to 60 s; stop a little earlier. */
export const MAX_RECORDING_SECONDS = 55;

export interface Recording {
  blob: Blob;
  durationSeconds: number;
  sampleRate: number;
}

export class RecorderError extends Error {
  constructor(
    public readonly code: "UNSUPPORTED" | "PERMISSION_DENIED" | "NO_MIC" | "NO_SPEECH",
    message: string,
  ) {
    super(message);
  }
}

const WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

export interface RecorderHandle {
  stop(): Promise<Recording>;
  cancel(): void;
}

/**
 * Starts recording. `onLevel` receives the input level (0–1) about 20 times a second so the UI can
 * show that the phone is hearing the speaker.
 */
export async function startRecording(onLevel?: (level: number) => void): Promise<RecorderHandle> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new RecorderError("UNSUPPORTED", "This browser cannot record audio. Open the app in Chrome.");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 48000 },
      },
    });
  } catch (err) {
    const name = (err as DOMException)?.name;
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new RecorderError("PERMISSION_DENIED", "Microphone permission was denied.");
    }
    throw new RecorderError("NO_MIC", "No microphone was found.");
  }

  const AudioCtx: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  await ctx.resume();

  const source = ctx.createMediaStreamSource(stream);
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 90;
  highpass.Q.value = 0.7;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 7600;
  lowpass.Q.value = 0.7;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -28;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.15;
  source.connect(highpass).connect(lowpass).connect(compressor);

  const chunks: Float32Array[] = [];
  let peakSinceTick = 0;
  const collect = (data: Float32Array) => {
    chunks.push(data);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peakSinceTick) peakSinceTick = v;
    }
  };

  // A muted sink keeps the graph pulling audio without playing it back through the speaker.
  const sink = ctx.createGain();
  sink.gain.value = 0;
  sink.connect(ctx.destination);

  let node: AudioNode;
  let workletUrl: string | undefined;
  if (ctx.audioWorklet) {
    workletUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(workletUrl);
    const worklet = new AudioWorkletNode(ctx, "pcm-capture");
    worklet.port.onmessage = (e) => collect(e.data as Float32Array);
    node = worklet;
  } else {
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => collect(new Float32Array(e.inputBuffer.getChannelData(0)));
    node = processor;
  }
  compressor.connect(node).connect(sink);

  const levelTimer = onLevel
    ? setInterval(() => {
        onLevel(Math.min(1, peakSinceTick * 1.5));
        peakSinceTick = 0;
      }, 50)
    : undefined;

  const release = () => {
    if (levelTimer) clearInterval(levelTimer);
    stream.getTracks().forEach((t) => t.stop());
    node.disconnect();
    void ctx.close();
    if (workletUrl) URL.revokeObjectURL(workletUrl);
  };

  return {
    cancel: release,
    async stop() {
      const inputRate = ctx.sampleRate;
      release();
      const samples = concat(chunks);
      const trimmed = trimSilence(samples, inputRate);
      if (!trimmed) {
        throw new RecorderError("NO_SPEECH", "No speech was heard.");
      }
      const pcm = resample(normalize(trimmed), inputRate, TARGET_SAMPLE_RATE);
      return {
        blob: encodeWav(pcm, TARGET_SAMPLE_RATE),
        durationSeconds: pcm.length / TARGET_SAMPLE_RATE,
        sampleRate: TARGET_SAMPLE_RATE,
      };
    },
  };
}

function concat(chunks: Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Removes silence before and after speech using 20 ms frame energy against the recording's own
 * noise floor. Returns undefined when no frame rises clearly above the floor (nothing was said).
 */
export function trimSilence(samples: Float32Array, rate: number): Float32Array | undefined {
  const frame = Math.max(1, Math.round(rate * 0.02));
  const frames = Math.floor(samples.length / frame);
  if (frames < 5) return undefined;
  const rms: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) sum += samples[i] * samples[i];
    rms.push(Math.sqrt(sum / frame));
  }
  const sorted = [...rms].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const loud = sorted[Math.floor(sorted.length * 0.95)];
  // Speech must be clearly above the floor and above an absolute minimum (about -45 dBFS).
  if (loud < 0.006 || loud < floor * 3) return undefined;
  const threshold = Math.max(floor * 2.5, 0.004);
  let first = rms.findIndex((r) => r > threshold);
  let last = rms.length - 1 - [...rms].reverse().findIndex((r) => r > threshold);
  // Keep 300 ms around the speech so soft first and last syllables are not clipped.
  const pad = Math.round(0.3 / 0.02);
  first = Math.max(0, first - pad);
  last = Math.min(frames - 1, last + pad);
  return samples.slice(first * frame, (last + 1) * frame);
}

/** Scales the recording so its peak sits at about -1 dBFS, with at most 20x gain. */
export function normalize(samples: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  if (peak === 0) return samples;
  const gain = Math.min(20, 0.89 / peak);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * gain;
  return out;
}

/** Linear-interpolation resampler. The 7.6 kHz low-pass in the capture chain prevents aliasing. */
export function resample(samples: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return samples;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const next = samples[idx + 1] ?? samples[idx];
    out[i] = samples[idx] + (next - samples[idx]) * frac;
  }
  return out;
}

/** 16-bit PCM mono WAV. */
export function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
