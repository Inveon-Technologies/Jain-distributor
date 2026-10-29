import { FRACTIONS, MODIFIERS, UNITS_TO_HUNDRED } from "./numbers.js";
import { PRODUCT_EN, UNITS } from "./parser.js";

/**
 * Speech adaptation hints for Google Speech-to-Text. Boosting the words a kirana order is made of
 * (product and brand names, units, number words) makes the recogniser prefer "रवा" over "रावा",
 * "गूळ" over "गुल", "पॅकेट" over "पाकेट" and so on, which is where most order mistakes come from.
 */

/** FMCG brands commonly ordered by village kirana shops, as they are spoken (Devanagari). */
const BRANDS = [
  "पार्ले", "पार्ले जी", "ब्रिटानिया", "गुड डे", "मारी", "मोनॅको", "हाइड अँड सीक", "डाबर", "कोलगेट", "पेप्सोडेंट",
  "क्लोजअप", "बबूल", "पतंजली", "लक्स", "लाईफबॉय", "संतूर", "डेटॉल", "सिंथॉल", "हमाम", "मेडिमिक्स", "निरमा",
  "घडी", "सर्फ एक्सेल", "रिन", "व्हील", "टाईड", "एरियल", "विम", "क्लिनिक प्लस", "सनसिल्क", "चिक", "पॅराशूट",
  "टाटा", "टाटा मीठ", "टाटा चहा", "रेड लेबल", "ब्रुक बॉन्ड", "ताजमहाल", "वाघ बकरी", "सोसायटी चहा", "अमूल",
  "गोवर्धन", "चितळे", "फॉर्च्यून", "सफोला", "धारा", "किसान", "मॅगी", "यिप्पी", "हल्दीराम", "बिकाजी", "कुरकुरे",
  "लेज", "एव्हरेस्ट", "एमडीएच", "बादशाह", "सुहाना", "प्रवीण", "रामबंधू", "केप्र", "आशीर्वाद", "पिल्सबरी",
  "राजधानी", "मंगलदीप", "सायकल अगरबत्ती", "होम लाइट", "शिप", "कोलगेट पावडर", "हार्पिक", "लायझॉल", "ओडोनील",
  "गुडनाईट", "ऑल आऊट", "मॉर्टिन", "फेविकॉल", "एव्हररेडी", "निप्पो",
];

/** Extra grocery words not covered by the parser's product table. */
const GROCERY = [
  "ज्वारी", "बाजरी", "नाचणी", "मका", "शेंगदाणा", "खोबरे", "सुके खोबरे", "चणे", "हरभरा", "मसूर", "मटकी", "चवळी",
  "उडीद डाळ", "मसूर डाळ", "कांदा लसूण मसाला", "गरम मसाला", "धणे", "धणे पूड", "हिंग", "वेलची", "लवंग", "दालचिनी",
  "काळी मिरी", "बडीशेप", "खसखस", "तीळ", "सुंठ", "शेवई", "पापड", "लोणचे", "सरबत", "बिस्किट पुडा", "नमकीन",
  "फरसाण", "चिवडा", "शेव", "खारी", "टोस्ट", "ब्रेड", "दूध पावडर", "साखर पोते", "कपडे धुण्याचा साबण",
  "आंघोळीचा साबण", "भांडी धुण्याचा साबण", "डिटर्जंट", "खोबरेल तेल", "केस तेल", "पावडर", "मेणबत्ती", "बॅटरी",
];

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
