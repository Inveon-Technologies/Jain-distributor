import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/lib/errors.js";
import { GoogleSpeechProvider, googleEncoding } from "../src/modules/voice/providers.js";

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
    const provider = new GoogleSpeechProvider("key-123", "mr-IN", fetchMock as unknown as typeof fetch);
    const result = await provider.transcribe(Buffer.from("audio"), "audio/webm", { sampleRateHertz: 44100 });

    expect(result.text).toBe("दहा किलो रवा पाच किलो साखर");
    expect(result.confidence).toBeCloseTo(0.8);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("key=key-123");
    const body = JSON.parse(init.body);
    expect(body.config).toMatchObject({ languageCode: "mr-IN", encoding: "WEBM_OPUS", sampleRateHertz: 44100 });
    expect(body.audio.content).toBe(Buffer.from("audio").toString("base64"));
  });

  it("surfaces upstream failures as 502", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("quota exceeded", { status: 429 }));
    const provider = new GoogleSpeechProvider("k", "mr-IN", fetchMock as unknown as typeof fetch);
    await expect(provider.transcribe(Buffer.from("x"), "audio/ogg")).rejects.toMatchObject({
      status: 502,
      code: "STT_FAILED",
    });
  });
});
