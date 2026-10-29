import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../../config.js";
import { badRequest, HttpError } from "../../lib/errors.js";
import { parse } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { parseOrderText, summarizeItems } from "./parser.js";
import { createSpeechProvider, type SpeechProvider } from "./providers.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_AUDIO_MB * 1024 * 1024, files: 1 },
});

export function createVoiceRouter(provider: SpeechProvider = createSpeechProvider()) {
  const router = Router();
  router.use(authenticate);

  /**
   * POST /voice/transcribe (multipart/form-data, field "audio")
   * Marathi speech → text → structured items for the review screen ("ऑर्डर तपासा").
   */
  router.post("/transcribe", upload.single("audio"), async (req, res) => {
    if (!req.file?.buffer.length) throw badRequest('Attach the recording as multipart field "audio"');
    // Under ~0.3 s of audio there is nothing to recognise; tell the app instead of returning "".
    if (req.file.buffer.length < 2000) throw badRequest("Recording is too short. Hold the mic and speak the order.");
    const { sampleRate } = parse(
      z.object({ sampleRate: z.coerce.number().int().min(8000).max(96000).optional() }),
      req.body ?? {},
    );
    const result = await provider.transcribe(req.file.buffer, req.file.mimetype, { sampleRateHertz: sampleRate });
    if (!result.text) {
      throw new HttpError(422, "NO_SPEECH", "No speech was recognised. Move closer to the phone and speak again.");
    }
    const parsed = parseOrderText(result.text);
    res.json({
      data: {
        text: result.text,
        confidence: result.confidence ?? null,
        // Ask the salesperson to check the transcript when Google was unsure or nothing was parsed.
        needsReview:
          (result.confidence !== undefined && result.confidence < config.STT_MIN_CONFIDENCE) ||
          (result.lowConfidenceWords?.length ?? 0) > 0 ||
          parsed.unparsed.length > 0 ||
          parsed.items.length === 0,
        lowConfidenceWords: result.lowConfidenceWords ?? [],
        provider: result.provider,
        language: config.STT_LANGUAGE,
        ...parsed,
        summary: summarizeItems(parsed.items),
      },
    });
  });

  /** POST /voice/parse { text } – re-parse after the salesperson edits the transcript (✏️ Edit). */
  router.post("/parse", (req, res) => {
    const { text } = parse(z.object({ text: z.string().trim().min(1).max(5000) }), req.body);
    const parsed = parseOrderText(text);
    res.json({ data: { text, ...parsed, summary: summarizeItems(parsed.items) } });
  });

  return router;
}
