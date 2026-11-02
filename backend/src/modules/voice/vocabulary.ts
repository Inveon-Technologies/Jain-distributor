import { FRACTIONS, MODIFIERS, UNITS_TO_HUNDRED } from "./numbers.js";
import { BRANDS, GROCERY } from "./lexicon.js";
import { PRODUCT_EN, UNITS } from "./parser.js";

/**
 * Speech adaptation hints for Google Speech-to-Text. Boosting the words a kirana order is made of
 * (product and brand names, units, number words) makes the recogniser prefer "रवा" over "रावा",
 * "गूळ" over "गुल", "पॅकेट" over "पाकेट" and so on, which is where most order mistakes come from.
 */

/** Order words that tie an item together ("द्या", "पाहिजे", "आणि"). */
const ORDER_WORDS = ["द्या", "पाहिजे", "आणि", "प्रत्येकी", "एकूण", "ऑर्डर"];

export interface SpeechContext {
  phrases: string[];
  boost: number;
}

/** Google accepts phrases of at most 100 characters; trim, de-duplicate and drop Latin-only aliases. */
function clean(phrases: Iterable<string>): string[] {
  const out = new Set<string>();
  for (const p of phrases) {
    const t = p.trim();
    if (t && t.length <= 100 && /[ऀ-ॿ]/.test(t)) out.add(t);
  }
  return [...out];
}

/**
 * Builds the two speech contexts sent with every request: product/brand vocabulary with the main
 * boost, and quantity words (numbers, fractions, units) with a lighter boost so they help without
 * forcing numbers into the transcript.
 */
export function buildSpeechContexts(boost: number, extraPhrases: string[] = []): SpeechContext[] {
  const products = clean([...Object.keys(PRODUCT_EN), ...BRANDS, ...GROCERY, ...extraPhrases]);
  const quantities = clean([
    ...Object.keys(UNITS_TO_HUNDRED),
    ...Object.keys(FRACTIONS),
    ...Object.keys(MODIFIERS),
    "हजार",
    "शंभर",
    ...UNITS.flatMap((u) => u.aliases),
    ...ORDER_WORDS,
  ]);
  const contexts: SpeechContext[] = [];
  if (boost > 0) {
    contexts.push({ phrases: products, boost });
    contexts.push({ phrases: quantities, boost: Math.max(1, Math.round(boost / 2)) });
  }
  return contexts;
}

/**
 * Keyterms for ElevenLabs Scribe: product, brand and grocery words (quantities and units are common
 * words it already knows). Capped at 1000 terms, the batch API's limit.
 */
export function buildKeyterms(extraPhrases: string[] = []): string[] {
  return clean([...extraPhrases, ...Object.keys(PRODUCT_EN), ...BRANDS, ...GROCERY]).slice(0, 1000);
}
