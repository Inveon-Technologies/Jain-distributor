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
];

const UNIT_BY_ALIAS = new Map<string, UnitDef>();
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
};

/** Words that carry no product information ("द्या" = give, "पाहिजे" = need, ...). */
const FILLERS = new Set([
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
  unparsed: string[];
}

function cleanToken(token: string): string {
  return token.replace(/^[("'“”‘’]+|[)"'“”‘’!?:]+$/g, "");
}

/** Splits "10kg" / "१०किलो" into ["10", "kg"]. */
function splitNumberUnit(token: string): string[] {
  const m = normalizeDigits(token).match(/^(\d+(?:\.\d+)?)(\D+)$/);
  return m && UNIT_BY_ALIAS.has(m[2].toLowerCase()) ? [m[1], m[2]] : [token];
}

function segmentsOf(text: string): string[][] {
  const segments: string[][] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) segments.push(current);
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
 * ("दहा किलो रवा पाच किलो साखर"); split it before each quantity that follows a product word.
 */
function splitRunOn(tokens: string[]): string[][] {
  const parts: string[][] = [];
  let current: string[] = [];
  let sawProduct = false;
  let sawQuantity = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isQty = isNumberToken(tok);
    if (isQty && sawProduct && sawQuantity && !isNumberToken(tokens[i - 1] ?? "")) {
      parts.push(current);
      current = [];
      sawProduct = false;
      sawQuantity = false;
    }
    current.push(tok);
    if (isQty) sawQuantity = true;
    else if (!UNIT_BY_ALIAS.has(tok.toLowerCase()) && !FILLERS.has(tok.toLowerCase())) sawProduct = true;
  }
  if (current.length) parts.push(current);
  return parts;
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

  const name = nameTokens.join(" ").trim();
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

export function parseOrderText(text: string): ParseResult {
  const items: OrderItem[] = [];
  const unparsed: string[] = [];
  for (const segment of segmentsOf(text)) {
    for (const part of splitRunOn(segment)) {
      const item = parseSegment(part);
      if (item) items.push(item);
      else if (part.some((t) => !FILLERS.has(t.toLowerCase()))) unparsed.push(part.join(" "));
    }
  }
  return { items, unparsed };
}

/** "रवा – 10 किलो | Parle Biscuit – 20 Packet" style one-line summary (PRD §5). */
export function summarizeItems(items: OrderItem[]): string {
  return items.map((i) => `${i.name} – ${i.quantity} ${i.unit.split(" (")[0]}`).join(" | ");
}
