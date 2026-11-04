import { BRANDS, GROCERY } from "./lexicon.js";
import { isNumberToken, normalizeDigits, readQuantity } from "./numbers.js";

/**
 * Turns a Marathi (or mixed Marathi/English) spoken order into line items.
 *
 *   "दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स."
 *   → रवा 10 kg | पार्ले बिस्किट 20 packet | गूळ 50 kg | डाबर टूथपेस्ट 5 box
 *
 * The text is split into segments on commas, "आणि"/"व"/"and" and full stops, and each segment is
 * read as quantity + unit + product in any order. Segments without a quantity are returned in
 * `unparsed` so the salesperson can fix them on the review screen.
 */

export interface UnitDef {
  code: string;
  mr: string;
  en: string;
  aliases: string[];
}

export const UNITS: UnitDef[] = [
  { code: "KG", mr: "किलो", en: "kg", aliases: ["किलो", "किलोग्राम", "किलोग्रॅम", "कि.ग्रॅ", "किग्रॅ", "kg", "kgs", "kilo", "kilos"] },
  { code: "GRAM", mr: "ग्रॅम", en: "g", aliases: ["ग्रॅम", "ग्राम", "gram", "grams", "gm", "g"] },
  { code: "LITRE", mr: "लिटर", en: "Ltr", aliases: ["लिटर", "लीटर", "litre", "liter", "litres", "liters", "ltr", "l"] },
  { code: "PACKET", mr: "पॅकेट", en: "Packet", aliases: ["पॅकेट", "पाकीट", "पाकिट", "पाकिटे", "पॅकेट्स", "packet", "packets", "pkt"] },
  { code: "BOX", mr: "बॉक्स", en: "Box", aliases: ["बॉक्स", "बोक्स", "खोका", "खोकी", "box", "boxes"] },
  { code: "PIECE", mr: "नग", en: "Piece", aliases: ["नग", "पीस", "piece", "pieces", "pcs", "pc"] },
  { code: "DOZEN", mr: "डझन", en: "Dozen", aliases: ["डझन", "dozen"] },
  { code: "BAG", mr: "पोते", en: "Bag", aliases: ["पोते", "पोती", "गोणी", "गोण्या", "बॅग", "bag", "bags", "sack"] },
  { code: "BOTTLE", mr: "बाटली", en: "Bottle", aliases: ["बाटली", "बाटल्या", "bottle", "bottles"] },
  { code: "CARTON", mr: "कार्टन", en: "Carton", aliases: ["कार्टन", "carton", "cartons"] },
  { code: "PACK", mr: "पुडा", en: "Pack", aliases: ["पुडा", "पुडे", "पुड्या", "pack", "packs"] },
  { code: "BUNCH", mr: "जुडी", en: "Bunch", aliases: ["जुडी", "जुड्या", "जुडया", "गड्डी", "गड्ड्या", "bunch", "bunches"] },
  { code: "ML", mr: "मिली", en: "ml", aliases: ["मिली", "मि.ली", "मि.ली.", "एमएल", "ml"] },
  { code: "JAR", mr: "बरणी", en: "Jar", aliases: ["बरणी", "बरण्या", "जार", "jar", "jars"] },
  { code: "STRIP", mr: "पट्टी", en: "Strip", aliases: ["पट्टी", "पट्ट्या", "पट्टया", "strip", "strips"] },
  { code: "BUNDLE", mr: "गठ्ठा", en: "Bundle", aliases: ["गठ्ठा", "गठ्ठे", "गट्टू", "bundle", "bundles"] },
];

/** Units that describe the pack size inside a product name ("शंभर मिली स्प्रे") rather than a count. */
const SIZE_UNIT_CODES = new Set(["KG", "GRAM", "LITRE", "ML"]);
const SIZE_LABEL: Record<string, string> = { KG: "किलो", GRAM: "ग्रॅम", LITRE: "लिटर", ML: "मिली" };

export const UNIT_BY_ALIAS = new Map<string, UnitDef>();
for (const u of UNITS) for (const a of u.aliases) UNIT_BY_ALIAS.set(a.toLowerCase(), u);

/** Common kirana items: spoken Marathi → English label shown next to it in the admin portal. */
export const PRODUCT_EN: Record<string, string> = {
  रवा: "Rava", साखर: "Sugar", गूळ: "Jaggery", गुळ: "Jaggery", तांदूळ: "Rice", तांदुळ: "Rice", गहू: "Wheat",
  पीठ: "Flour", आटा: "Atta", मैदा: "Maida", बेसन: "Besan", डाळ: "Dal", "तूर डाळ": "Toor Dal", "मूग डाळ": "Moong Dal",
  "हरभरा डाळ": "Chana Dal", पोहे: "Poha", तेल: "Oil", "शेंगदाणा तेल": "Groundnut Oil", "सोयाबीन तेल": "Soybean Oil",
  शेंगदाणे: "Groundnuts", मीठ: "Salt", चहा: "Tea", "चहा पावडर": "Tea Powder", कॉफी: "Coffee", तूप: "Ghee",
  साबण: "Soap", टूथपेस्ट: "Toothpaste", बिस्किट: "Biscuit", बिस्कीट: "Biscuit", "पार्ले बिस्किट": "Parle Biscuit",
  "पार्ले बिस्कीट": "Parle Biscuit", "डाबर टूथपेस्ट": "Dabur Toothpaste", हळद: "Turmeric", मिरची: "Chilli",
  "लाल मिरची": "Red Chilli", जिरे: "Cumin", मोहरी: "Mustard Seeds", शाम्पू: "Shampoo", "वॉशिंग पावडर": "Washing Powder",
  अगरबत्ती: "Agarbatti", काडेपेटी: "Matchbox", साबुदाणा: "Sabudana",
  पिठीसाखर: "Powdered Sugar", खोबरं: "Dry Coconut", खोबरे: "Dry Coconut", कांदा: "Onion", कांदे: "Onion",
  लसूण: "Garlic", आले: "Ginger", आलं: "Ginger", कोथिंबीर: "Coriander", बटाटा: "Potato", बटाटे: "Potato",
  "हिरवी मिरची": "Green Chilli", शेंगदाणा: "Groundnuts", पोहा: "Poha"
};

/** Words that carry no product information ("द्या" = give, "पाहिजे" = need, ...). */
export const FILLERS = new Set([
  "द्या", "दे", "देणे", "पाहिजे", "पाहिजेत", "हवे", "हवा", "हवी", "हवेत", "घ्या", "घ्यायचे", "पण", "आणखी", "अजून",
  "ऑर्डर", "मला", "आम्हाला", "please", "प्लीज", "चे", "ची", "चा", "ला", "मध्ये", "of",
]);

const CONJUNCTIONS = new Set(["आणि", "आणी", "व", "and", "अन्", "अन"]);

export interface OrderItem {
  name: string;
  nameEn?: string;
  quantity: number;
  unit: string;
  unitCode: string;
}

export interface ParseResult {
  items: OrderItem[];
  /** Parts that sound like an order line but could not be read (no quantity, for example). */
  unparsed: string[];
  /**
   * Parts with no product, unit or number word at all: usually people talking nearby that the
   * microphone picked up. Left out of the order but returned so the app can show them.
   */
  ignored: string[];
}

export interface ParseOptions {
  /**
   * Extra product vocabulary, such as the Item Master: words it knows are treated like the
   * built-in product list (kept in item names, never mistaken for background talk).
   */
  isKnownWord?: (token: string) => boolean;
}

/** Words that turn the number before them into a price: "दहा रुपये" / "दहा रुपयांचा" = ₹10. */
const RUPEE_WORDS = new Set([
  "रुपये", "रुपया", "रुपयांचा", "रुपयाचा", "रुपयाची", "रुपयांची", "रुपयाचे", "रुपयांचे", "रुपयांच्या", "रुपयाच्या",
  "रुपयांचं", "रुपयाचं", "रु", "रु.", "रू", "rs", "rs.", "rupees", "rupee", "₹", "वाला", "वाले", "वाली",
]);

/** "₹10" tokens carry a price; "100मिली" / "500ग्रॅम" tokens carry a pack size. Both stay in the name. */
export const isPriceToken = (token: string) => /^₹\d+(\.\d+)?$/.test(token);
export function sizeOf(token: string): { value: number; unitCode: string } | undefined {
  const m = normalizeDigits(token).match(/^(\d+(?:\.\d+)?)(\D+)$/);
  const unit = m && UNIT_BY_ALIAS.get(m[2].toLowerCase());
  return unit && SIZE_UNIT_CODES.has(unit.code) ? { value: parseFloat(m[1]), unitCode: unit.code } : undefined;
}

/**
 * Rewrites spoken prices as one "₹N" token so they are not read as the quantity:
 * "पार्ले जी दहा रुपये वीस पॅकेट" → पार्ले जी ₹10 वीस पॅकेट; also "दहाचे"/"दहाचा" (the ten-rupee one), "10rs".
 */
export function markPrices(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const fused = normalizeDigits(tok).match(/^(?:₹|rs\.?)(\d+(?:\.\d+)?)$|^(\d+(?:\.\d+)?)(?:₹|rs|रु|रू)$/i);
    if (fused) {
      out.push(`₹${fused[1] ?? fused[2]}`);
      continue;
    }
    const ofNumber = tok.match(/^(.+?)(चा|ची|चे|च्या|चं)$/u);
    if (ofNumber && isNumberToken(ofNumber[1]) && !isNumberToken(tok)) {
      const q = readQuantity([ofNumber[1]], 0);
      if (q) {
        out.push(`₹${q.value}`);
        continue;
      }
    }
    if (isNumberToken(tok)) {
      const q = readQuantity(tokens, i);
      const after = q && tokens[i + q.consumed];
      if (q && after && RUPEE_WORDS.has(after.toLowerCase())) {
        out.push(`₹${q.value}`);
        i += q.consumed;
        continue;
      }
    }
    out.push(tok);
  }
  return out;
}

function cleanToken(token: string): string {
  return token.replace(/^[("'“”‘’]+|[)"'“”‘’!?:]+$/g, "");
}

/**
 * Traditional measures spoken as one word, expanded to quantity + unit tokens:
 * "पावशेर" (a quarter sher) is sold as 250 g, "अच्छेर"/"अर्धाशेर" as 500 g.
 */
const MEASURE_WORDS: Record<string, string[]> = {
  पावशेर: ["250", "ग्रॅम"],
  पावशेर्: ["250", "ग्रॅम"],
  पावशेरी: ["250", "ग्रॅम"],
  अच्छेर: ["500", "ग्रॅम"],
  अर्धाशेर: ["500", "ग्रॅम"],
};

/** Splits "10kg" / "१०किलो" into ["10", "kg"] and expands measure words like "पावशेर". */
function splitNumberUnit(token: string): string[] {
  if (MEASURE_WORDS[token]) return MEASURE_WORDS[token];
  const m = normalizeDigits(token).match(/^(\d+(?:\.\d+)?)(\D+)$/);
  return m && UNIT_BY_ALIAS.has(m[2].toLowerCase()) ? [m[1], m[2]] : [token];
}

function segmentsOf(text: string): string[][] {
  const segments: string[][] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) segments.push(markPrices(current));
    current = [];
  };
  // Commas, danda, semicolons, newlines and sentence-ending full stops separate items.
  for (const chunk of text.split(/[,،;।\n]+|\.(?!\d)/)) {
    for (const raw of chunk.trim().split(/\s+/)) {
      const token = cleanToken(raw);
      if (!token) continue;
      if (CONJUNCTIONS.has(token.toLowerCase())) {
        flush();
        continue;
      }
      current.push(...splitNumberUnit(token));
    }
    flush();
  }
  return segments;
}

/**
 * A segment can hold more than one item when the speaker drops separators
 * ("दहा किलो रवा पाच किलो साखर"); split it before each quantity that follows a product word, or
 * that follows a complete quantity + unit with no product ("पावशेर चार जुडी कोथिंबीर").
 */
function splitRunOn(tokens: string[]): string[][] {
  const parts: string[][] = [];
  let current: string[] = [];
  let sawProduct = false;
  let sawQuantity = false;
  let sawUnit = false;
  let sawCountUnit = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isQty = isNumberToken(tok);
    if (isQty && sawQuantity && (sawProduct || sawUnit) && !isNumberToken(tokens[i - 1] ?? "")) {
      // "एको स्प्रे शंभर मिली दोन नग": the first number is the pack size, the second the quantity.
      const fused = sizeBeforeCount(current, tokens, i);
      if (fused) {
        current = fused;
        sawQuantity = false;
        sawUnit = false;
      } else {
        // "दोन नग एको स्प्रे शंभर मिली": a size spoken after a counted item belongs to it.
        const trailing = sizeAtEnd(tokens, i);
        if (trailing && sawCountUnit && isProductWord(current.at(-1) ?? "")) {
          current.push(trailing);
          break;
        }
        parts.push(current);
        current = [];
        sawProduct = false;
        sawQuantity = false;
        sawUnit = false;
        sawCountUnit = false;
      }
    }
    current.push(tok);
    const unit = UNIT_BY_ALIAS.get(tok.toLowerCase());
    if (isQty) sawQuantity = true;
    else if (unit) {
      sawUnit = true;
      if (!SIZE_UNIT_CODES.has(unit.code)) sawCountUnit = true;
    } else if (!FILLERS.has(tok.toLowerCase())) sawProduct = true;
  }
  if (current.length) parts.push(current);
  return parts;
}

const isProductWord = (tok: string) =>
  !!tok && !isNumberToken(tok) && !UNIT_BY_ALIAS.has(tok.toLowerCase()) && !FILLERS.has(tok.toLowerCase());

/** A quantity followed by a size unit, as one "100मिली" token. */
function sizeToken(tokens: string[], start: number): { token: string; end: number } | undefined {
  const q = readQuantity(tokens, start);
  if (!q) return undefined;
  const unit = UNIT_BY_ALIAS.get((tokens[start + q.consumed] ?? "").toLowerCase());
  if (!unit || !SIZE_UNIT_CODES.has(unit.code)) return undefined;
  return { token: `${Math.round(q.value * 1000) / 1000}${SIZE_LABEL[unit.code]}`, end: start + q.consumed + 1 };
}

/**
 * `current` is [product…, quantity, size unit] and the speech continues with quantity + count unit
 * and no new product: returns `current` with the quantity and size unit fused into a size token.
 */
function sizeBeforeCount(current: string[], tokens: string[], i: number): string[] | undefined {
  const k = current.findIndex((t) => isNumberToken(t));
  if (k <= 0 || !isProductWord(current[k - 1])) return undefined;
  const size = sizeToken(current, k);
  if (!size || size.end !== current.length) return undefined;
  const q = readQuantity(tokens, i);
  const unit = q && UNIT_BY_ALIAS.get((tokens[i + q.consumed] ?? "").toLowerCase());
  if (!q || !unit || SIZE_UNIT_CODES.has(unit.code)) return undefined;
  for (let j = i + q.consumed + 1; j < tokens.length && !isNumberToken(tokens[j]); j++) {
    if (isProductWord(tokens[j])) return undefined;
  }
  return [...current.slice(0, k), size.token];
}

/** The rest of the segment is only a quantity + size unit (and filler words). */
function sizeAtEnd(tokens: string[], i: number): string | undefined {
  const size = sizeToken(tokens, i);
  if (!size) return undefined;
  return tokens.slice(size.end).every((t) => FILLERS.has(t.toLowerCase())) ? size.token : undefined;
}

/** Drops trailing vowel signs so "शेंगदाणा" / "शेंगदाणे" / "शेंगदाण्या" compare equal. */
function stem(word: string): string {
  return word.replace(/[\u093E-\u094D\u0902\u0903]+$/u, "").replace(/्य$/u, "");
}

/**
 * Speakers often repeat or correct a word ("शेंगदाणा शेंगदाणे"); recognisers keep both. Collapse
 * neighbouring words with the same stem, keeping the one the product list knows.
 */
function dedupeRepeats(tokens: string[]): string[] {
  const out: string[] = [];
  for (const tok of tokens) {
    const prev = out.at(-1);
    if (prev !== undefined && stem(prev) === stem(tok)) {
      if (!PRODUCT_EN[prev] && PRODUCT_EN[tok]) out[out.length - 1] = tok;
      continue;
    }
    out.push(tok);
  }
  return out;
}

function englishName(name: string): string | undefined {
  if (PRODUCT_EN[name]) return PRODUCT_EN[name];
  // Fall back to the last word: "मोठा साबण" → Soap.
  const last = name.split(" ").at(-1) ?? "";
  return PRODUCT_EN[last];
}

function parseSegment(tokens: string[]): OrderItem | undefined {
  let quantity: number | undefined;
  let unit: UnitDef | undefined;
  const nameTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (quantity === undefined && isNumberToken(tok)) {
      const q = readQuantity(tokens, i);
      if (q) {
        quantity = q.value;
        i += q.consumed - 1;
        continue;
      }
    }
    const u = UNIT_BY_ALIAS.get(tok.toLowerCase());
    if (!unit && u) {
      unit = u;
      continue;
    }
    if (FILLERS.has(tok.toLowerCase())) continue;
    nameTokens.push(tok);
  }

  const name = dedupeRepeats(nameTokens).join(" ").trim();
  if (quantity === undefined || quantity <= 0 || !name) return undefined;
  const resolved = unit ?? UNITS.find((u) => u.code === "PIECE")!;
  return {
    name,
    nameEn: englishName(name),
    quantity: Math.round(quantity * 1000) / 1000,
    unit: `${resolved.mr} (${resolved.en})`,
    unitCode: resolved.code,
  };
}

/** "₹10 पार्ले जी" → "पार्ले जी ₹10": the price reads best after the product. */
function pricesLast(name: string): string {
  const words = name.split(" ");
  const prices = words.filter(isPriceToken);
  return prices.length && !isPriceToken(words.at(-1) ?? "") ? [...words.filter((w) => !isPriceToken(w)), ...prices].join(" ") : name;
}

let lexiconStems: Set<string> | undefined;

/** Stems of every word in the product, brand and grocery lists. */
function knownStems(): Set<string> {
  lexiconStems ??= new Set(
    [...Object.keys(PRODUCT_EN), ...BRANDS, ...GROCERY]
      .flatMap((p) => p.split(/\s+/))
      .filter((w) => w.length > 1)
      .map(stem),
  );
  return lexiconStems;
}

const isBuiltInWord = (token: string) => knownStems().has(stem(token)) || isPriceToken(token) || !!sizeOf(token);
const isUnitWord = (token: string) => UNIT_BY_ALIAS.has(token.toLowerCase());

/**
 * Background talk often lands inside an item ("रवा अरे तू कधी आलास"). When the name contains a known
 * product, keep it with at most one describing word in front ("बारीक रवा") and drop the rest.
 */
function trimChatter(name: string, isKnownWord: (t: string) => boolean): { name: string; extra?: string } {
  const words = name.split(" ");
  const known = words.map(isKnownWord);
  const first = known.indexOf(true);
  if (first === -1) return { name };
  const last = known.lastIndexOf(true);
  const start = Math.max(0, first - 1);
  const kept = words.slice(start, last + 1);
  const dropped = [...words.slice(0, start), ...words.slice(last + 1)];
  return { name: kept.join(" "), extra: dropped.length ? dropped.join(" ") : undefined };
}

export function parseOrderText(text: string, options: ParseOptions = {}): ParseResult {
  const extra = options.isKnownWord;
  const isKnownWord = extra ? (t: string) => isBuiltInWord(t) || extra(t) : isBuiltInWord;
  const items: OrderItem[] = [];
  const unparsed: string[] = [];
  const ignored: string[] = [];
  for (const segment of segmentsOf(text)) {
    for (const part of splitRunOn(segment)) {
      const words = part.filter((t) => !FILLERS.has(t.toLowerCase()));
      if (!words.length) continue;
      const item = parseSegment(part);
      // A number with neither a unit nor a known product ("दोन मिनिटात येतो") is conversation, not an item.
      if (item && (part.some(isUnitWord) || item.name.split(" ").some(isKnownWord))) {
        const trimmed = trimChatter(item.name, isKnownWord);
        const name = pricesLast(trimmed.name);
        items.push(name === item.name ? item : { ...item, name, nameEn: englishName(name) });
        if (trimmed.extra) ignored.push(trimmed.extra);
      } else if (words.some((t) => isUnitWord(t) || isKnownWord(t))) unparsed.push(part.join(" "));
      else ignored.push(part.join(" "));
    }
  }
  return { items, unparsed, ignored };
}

/**
 * The order as the salesperson sees it after speaking: one item per line with the quantity in
 * digits ("रवा 1 किलो"), then any part that could not be read so it can be fixed by hand. The text
 * parses back to the same items.
 */
export function formatOrderText(result: ParseResult): string {
  const lines = result.items.map((i) => `${i.name} ${i.quantity} ${i.unit.split(" (")[0]}`);
  return [...lines, ...result.unparsed].join("\n");
}

/** "रवा – 10 किलो | Parle Biscuit – 20 Packet" style one-line summary (PRD §5). */
export function summarizeItems(items: OrderItem[]): string {
  return items.map((i) => `${i.name} – ${i.quantity} ${i.unit.split(" (")[0]}`).join(" | ");
}
