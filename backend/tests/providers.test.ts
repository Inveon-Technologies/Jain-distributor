import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/lib/errors.js";
import { GoogleSpeechProvider, googleEncoding, pickAlternative } from "../src/modules/voice/providers.js";
import { buildSpeechContexts } from "../src/modules/voice/vocabulary.js";

describe("googleEncoding", () => {
  it("maps browser recording formats", () => {
    expect(googleEncoding("audio/webm;codecs=opus")).toBe("WEBM_OPUS");
    expect(googleEncoding("audio/ogg")).toBe("OGG_OPUS");
    expect(googleEncoding("audio/wav")).toBeUndefined();
    expect(googleEncoding("audio/mpeg")).toBe("MP3");
    expect(() => googleEncoding("video/mp4")).toThrow(HttpError);
  });
});

describe("GoogleSpeechProvider", () => {
  it("sends mr-IN audio and joins the best alternatives", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            { alternatives: [{ transcript: "दहा किलो रवा", confidence: 0.9 }] },
            { alternatives: [{ transcript: " पाच किलो साखर", confidence: 0.7 }] },
          ],
        }),
        { status: 200 },
      ),
    );
    const provider = new GoogleSpeechProvider("key-123", "mr-IN", {
      model: "latest_long",
      speechContexts: buildSpeechContexts(12),
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const result = await provider.transcribe(Buffer.from("audio"), "audio/webm", { sampleRateHertz: 44100 });

    expect(result.text).toBe("दहा किलो रवा पाच किलो साखर");
    expect(result.confidence).toBeCloseTo(0.8);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("key=key-123");
    const body = JSON.parse(init.body);
    expect(body.config).toMatchObject({
      languageCode: "mr-IN",
      model: "latest_long",
      encoding: "WEBM_OPUS",
      sampleRateHertz: 44100,
      enableWordConfidence: true,
      maxAlternatives: 3,
    });
    expect(body.config.alternativeLanguageCodes).toBeUndefined();
    expect(body.config.speechContexts[0].phrases).toEqual(expect.arrayContaining(["रवा", "गूळ", "पार्ले"]));
    expect(body.config.speechContexts[1].phrases).toEqual(expect.arrayContaining(["दहा", "किलो", "पॅकेट"]));
    expect(body.audio.content).toBe(Buffer.from("audio").toString("base64"));
  });

  it("surfaces upstream failures as 502", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("quota exceeded", { status: 429 }));
    const provider = new GoogleSpeechProvider("k", "mr-IN", { fetchImpl: fetchMock as unknown as typeof fetch });
    await expect(provider.transcribe(Buffer.from("x"), "audio/ogg")).rejects.toMatchObject({
      status: 502,
      code: "STT_FAILED",
    });
  });
});

describe("GoogleSpeechProvider accuracy handling", () => {
  const ok = (json: unknown) => new Response(JSON.stringify(json), { status: 200 });

  it("retries with the default model and no hints when Google rejects the tuned request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("model not supported for language", { status: 400 }))
      .mockResolvedValueOnce(ok({ results: [{ alternatives: [{ transcript: "दहा किलो रवा", confidence: 0.92 }] }] }));
    const provider = new GoogleSpeechProvider("k", "mr-IN", {
      model: "latest_long",
      speechContexts: buildSpeechContexts(12),
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const result = await provider.transcribe(Buffer.from("x"), "audio/wav");
    expect(result.text).toBe("दहा किलो रवा");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retry = JSON.parse(fetchMock.mock.calls[1][1].body).config;
    expect(retry.model).toBeUndefined();
    expect(retry.speechContexts).toBeUndefined();
  });

  it("reports words below the confidence threshold", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      ok({
        results: [
          {
            alternatives: [
              {
                transcript: "पाच किलो साखर",
                confidence: 0.81,
                words: [
                  { word: "पाच", confidence: 0.95 },
                  { word: "किलो", confidence: 0.9 },
                  { word: "साखर.", confidence: 0.41 },
                ],
              },
            ],
          },
        ],
      }),
    );
    const provider = new GoogleSpeechProvider("k", "mr-IN", {
      minWordConfidence: 0.7,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const result = await provider.transcribe(Buffer.from("x"), "audio/wav");
    expect(result.lowConfidenceWords).toEqual(["साखर"]);
  });
});

describe("pickAlternative", () => {
  it("prefers an alternative that reads as a complete order line", () => {
    const best = pickAlternative([
      { transcript: "पाच किलो सागर दहा", confidence: 0.8 },
      { transcript: "पाच किलो साखर, दहा किलो रवा" },
    ]);
    expect(best?.transcript).toBe("पाच किलो साखर, दहा किलो रवा");
  });

  it("keeps Google's top choice when alternatives are no better", () => {
    const best = pickAlternative([{ transcript: "दहा किलो रवा", confidence: 0.9 }, { transcript: "दहा किलो रावा" }]);
    expect(best?.transcript).toBe("दहा किलो रवा");
  });
});

describe("UnconfiguredSpeechProvider", () => {
  it("fails with 503 instead of inventing a transcript", async () => {
    const { UnconfiguredSpeechProvider } = await import("../src/modules/voice/providers.js");
    await expect(new UnconfiguredSpeechProvider().transcribe()).rejects.toMatchObject({
      status: 503,
      code: "STT_NOT_CONFIGURED",
    });
  });
});
