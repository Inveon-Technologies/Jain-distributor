import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../../config.js";
import { badRequest } from "../../lib/errors.js";
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
    const { sampleRate } = parse(
      z.object({ sampleRate: z.coerce.number().int().min(8000).max(96000).optional() }),
      req.body ?? {},
    );
    const result = await provider.transcribe(req.file.buffer, req.file.mimetype, { sampleRateHertz: sampleRate });
    const parsed = parseOrderText(result.text);
    res.json({
      data: {
        text: result.text,
        confidence: result.confidence ?? null,
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
