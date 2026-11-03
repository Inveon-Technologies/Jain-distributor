import { normalizeDigits, readQuantity, isNumberToken } from "../voice/numbers.js";
import { editDistance, isDevanagari, keyOf, similarity, spelledLetters, type WordKey } from "../voice/phonetic.js";
import { FILLERS, isPriceToken, markPrices, PRODUCT_EN, sizeOf, UNIT_BY_ALIAS } from "../voice/parser.js";
import { ENGLISH_NUMBERS, marathiSynonyms } from "./synonyms.js";

/**
 * Finds Item Master entries for a spoken product name.
 *
 * The salesperson says "पार्ले जी ₹10" (Marathi, Devanagari); the master holds "PARLE G RS 10". Each
 * word is compared by sound (see voice/phonetic.ts), Marathi words with English meanings are
 * translated (साबण → SOAP), and prices / pack sizes are compared as numbers. Rare words weigh more
 * than common ones, so the brand decides more than "CREAM" or "SOAP".
 */

export interface CatalogItem {
  id: string;
  name: string;
  marathiName: string | null;
  aliases: string[];
  unit: string;
  packType: string;
  price: number | null;
}

export interface Suggestion {
  id: string;
  name: string;
  marathiName: string | null;
  unit: string;
  price: number | null;
  score: number;
}

/** Words in item names that say nothing about which product it is. */
const STOP_WORDS = new Set(["RS", "ML", "GM", "G", "KG", "LTR", "L", "MG", "&", "AND", "OF", "THE", "WITH", "NEW", "-"]);

const MEASURE: Record<string, string> = { ML: "ML", GM: "GRAM", G: "GRAM", KG: "KG", LTR: "LITRE", L: "LITRE" };

/** Spoken units → billing pack types, for a small bonus when the packing agrees. */
const PACK_FOR_UNIT: Record<string, string[]> = {
  PACKET: ["PKT", "POUCH"], PACK: ["PKT", "PUDA"], BOX: ["BOX", "DABBA"], PIECE: ["PCS", "UNIT"], DOZEN: ["DOZ"],
  BAG: ["BAG"], JAR: ["JAR"], STRIP: ["PATTI"], BUNDLE: ["GATTU", "BUNDLE"], KG: ["KG"], GRAM: ["GM"],
};

/** Score at or above which the best suggestion is picked for the salesperson automatically. */
export const AUTO_MATCH_SCORE = 0.55;
const MIN_SCORE = 0.3;
const WORD_MATCH = 0.7;

interface Size {
  value: number;
  unitCode: string;
}

interface Variant {
  words: number[]; // indexes into the vocabulary
  weight: number; // sum of the words' weights
}

interface Entry {
  item: CatalogItem;
  variants: Variant[];
  sizes: Size[];
  numbers: Set<number>;
}

interface QueryWord {
  keys: WordKey[];
  /** Keys of the word's English meanings ("साबण" → SOAP): count a little less than the word's own sound. */
  meaningKeys: WordKey[];
  text: string;
}

interface Query {
  words: QueryWord[];
  prices: number[];
  sizes: Size[];
  numbers: number[];
}

function tokenizeName(name: string): { words: string[]; sizes: Size[]; numbers: number[] } {
  const words: string[] = [];
  const sizes: Size[] = [];
  const numbers: number[] = [];
  const tokens = name
    .toUpperCase()
    .replace(/(\d)(ML|GM|KG|LTR|G)\b/g, "$1 $2")
    .split(/[^A-Z0-9.+]+|\.(?!\d)/)
    .filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (/^\d+(\.\d+)?$/.test(tok)) {
      const value = parseFloat(tok);
      const measure = MEASURE[tokens[i + 1] ?? ""];
      if (measure) {
        sizes.push({ value, unitCode: measure });
        i++;
      } else numbers.push(value);
      continue;
    }
    if (STOP_WORDS.has(tok) || /^[+.]+$/.test(tok)) continue;
    words.push(tok);
  }
  return { words, sizes, numbers };
}

const sameSize = (a: Size, b: Size) =>
  a.unitCode === b.unitCode
    ? a.value === b.value
    : (a.unitCode === "KG" && b.unitCode === "GRAM" && a.value * 1000 === b.value) ||
      (a.unitCode === "GRAM" && b.unitCode === "KG" && a.value === b.value * 1000) ||
      (a.unitCode === "LITRE" && b.unitCode === "ML" && a.value * 1000 === b.value) ||
      (a.unitCode === "ML" && b.unitCode === "LITRE" && a.value === b.value * 1000);

export class ItemMatcher {
  private readonly vocab: { text: string; key: WordKey; weight: number }[] = [];
  private readonly vocabIndex = new Map<string, number>();
  private readonly entries: Entry[];
  private readonly letters = new Set<string>();
  private readonly knownCache = new Map<string, boolean>();

  constructor(items: CatalogItem[]) {
    const df = new Map<string, number>();
    const parsed = items.map((item) => {
      const main = tokenizeName(item.name);
      const others = [item.marathiName, ...item.aliases]
        .filter((t): t is string => !!t && !!t.trim())
        .map((t) => this.queryWords(t).map((w) => w.text));
      const variants = [main.words, ...others].filter((w) => w.length);
      const distinct = new Set(variants.flat());
      for (const w of distinct) df.set(w, (df.get(w) ?? 0) + 1);
      return { item, main, variants };
    });

    const n = Math.max(items.length, 1);
    const indexOf = (text: string) => {
      let idx = this.vocabIndex.get(text);
      if (idx === undefined) {
        idx = this.vocab.length;
        const weight = Math.log(1 + n / (df.get(text) ?? 1));
        this.vocab.push({ text, key: keyOf(text), weight });
        this.vocabIndex.set(text, idx);
        if (/^[A-Z]$/.test(text)) this.letters.add(text);
      }
      return idx;
    };

    this.entries = parsed.map(({ item, main, variants }) => ({
      item,
      sizes: main.sizes,
      numbers: new Set(main.numbers),
      variants: variants.map((words) => {
        const idx = [...new Set(words)].map(indexOf);
        return { words: idx, weight: idx.reduce((s, i) => s + this.vocab[i].weight, 0) };
      }),
    }));
  }

  get size() {
    return this.entries.length;
  }

  /** Marathi names and aliases from the master, for the speech recogniser's hints. */
  spokenPhrases(limit = 1000): string[] {
    const out = new Set<string>();
    for (const { item } of this.entries) {
      for (const p of [item.marathiName, ...item.aliases]) if (p && isDevanagari(p)) out.add(p.trim());
      if (out.size >= limit) break;
    }
    return [...out];
  }

  /** Words of a spoken / typed name, with price, size and number tokens taken out. */
  private queryWords(text: string): QueryWord[] {
    return this.parseQuery(text).words;
  }

  private parseQuery(text: string): Query {
    const query: Query = { words: [], prices: [], sizes: [], numbers: [] };
    // "दहा रुपये" → ₹10, as in spoken orders.
    const tokens = markPrices(
      normalizeDigits(text)
        .replace(/[()[\],;:!?"'“”‘’]/g, " ")
        .split(/\s+/)
        .filter(Boolean),
    );
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (isPriceToken(tok)) {
        query.prices.push(parseFloat(tok.slice(1)));
        continue;
      }
      const size = sizeOf(tok) ?? latinSize(tok, tokens[i + 1]);
      if (size) {
        query.sizes.push(size);
        if (!sizeOf(tok) && !/\D$/.test(tok)) i++;
        continue;
      }
      if (/^rs\.?$|^रु(पये)?$|^₹$/i.test(tok) && /^\d/.test(tokens[i + 1] ?? "")) {
        query.prices.push(parseFloat(tokens[++i]));
        continue;
      }
      if (isNumberToken(tok)) {
        const q = readQuantity(tokens, i);
        if (q) {
          query.numbers.push(q.value);
          i += q.consumed - 1;
          continue;
        }
      }
      const word = isDevanagari(tok) ? tok : tok.toUpperCase();
      if (STOP_WORDS.has(word)) continue;
      // Order words ("द्या") and units ("पॅकेट") say nothing about which product it is.
      if (isDevanagari(tok) && (FILLERS.has(tok) || UNIT_BY_ALIAS.has(tok))) continue;
      if (ENGLISH_NUMBERS[word] !== undefined) query.numbers.push(ENGLISH_NUMBERS[word]);
      query.words.push({ text: word, keys: [keyOf(word)], meaningKeys: synonymsOf(word).map(keyOf) });
    }
    return query;
  }

  /** Best sound match of each query word against every vocabulary word (only good matches kept). */
  private matchWords(words: QueryWord[]): Map<number, number>[] {
    return words.map((w) => {
      const hits = new Map<number, number>();
      this.vocab.forEach((v, idx) => {
        let best = 0;
        for (const k of w.keys) best = Math.max(best, similarity(k, v.key));
        // A translated word is less telling than a brand name heard as such ("गुलाबी लक्स" is LUX first).
        for (const k of w.meaningKeys) best = Math.max(best, similarity(k, v.key) * 0.85);
        if (best >= WORD_MATCH) hits.set(idx, best);
      });
      return hits;
    });
  }

  /**
   * Item Master entries for a spoken name, best first. `unitCode` (the spoken unit, such as PACKET)
   * breaks ties in favour of items billed in that packing.
   */
  suggest(spoken: string, opts: { limit?: number; unitCode?: string } = {}): Suggestion[] {
    const query = this.parseQuery(spoken);
    if (!query.words.length) return [];
    const hits = this.matchWords(query.words);
    const avgWeight = this.vocab.length ? this.vocab.reduce((s, v) => s + v.weight, 0) / this.vocab.length : 1;
    // A word that matches nothing still counts against the score, as a typical word would.
    const queryWeights = hits.map((h) => {
      let best = 0;
      let weight = avgWeight;
      for (const [idx, sim] of h) {
        if (sim > best) {
          best = sim;
          weight = this.vocab[idx].weight;
        }
      }
      return weight;
    });
    const queryTotal = queryWeights.reduce((s, w) => s + w, 0);
    const packs = opts.unitCode ? PACK_FOR_UNIT[opts.unitCode] : undefined;

    const scored: (Suggestion & { raw: number })[] = [];
    for (const entry of this.entries) {
      let best = 0;
      for (const variant of entry.variants) {
        let queryCovered = 0;
        let itemCovered = 0;
        let firstWord = false;
        const used = new Set<number>();
        hits.forEach((h, qi) => {
          let sim = 0;
          let at = -1;
          variant.words.forEach((idx, pos) => {
            const s = h.get(idx);
            if (s !== undefined && s > sim && !used.has(idx)) {
              sim = s;
              at = pos;
            }
          });
          if (at === -1) return;
          used.add(variant.words[at]);
          // Squared, so a near miss ("COMFORT" for "कापूर" → CAMPHOR) loses clearly to an exact word.
          queryCovered += queryWeights[qi] * sim * sim;
          itemCovered += this.vocab[variant.words[at]].weight * sim * sim;
          if (qi === 0 && at === 0) firstWord = true;
        });
        if (!queryCovered) continue;
        let score = 0.6 * (queryCovered / queryTotal) + 0.4 * (itemCovered / (variant.weight || 1));
        if (firstWord) score += 0.05;
        best = Math.max(best, score);
      }
      if (best < MIN_SCORE - 0.15) continue;
      best += this.numberScore(entry, query);
      if (packs?.includes(entry.item.packType)) best += 0.02;
      if (best >= MIN_SCORE) {
        const { id, name, marathiName, unit, price } = entry.item;
        scored.push({ id, name, marathiName, unit, price, score: Math.round(Math.min(1, best) * 1000) / 1000, raw: best });
      }
    }
    scored.sort((a, b) => b.raw - a.raw || a.name.length - b.name.length || a.name.localeCompare(b.name));
    return scored.slice(0, opts.limit ?? 5).map(({ raw: _raw, ...s }) => s);
  }

  private numberScore(entry: Entry, query: Query): number {
    let bonus = 0;
    const price = entry.item.price;
    for (const p of query.prices) {
      if (price === p) bonus += 0.2;
      else if (price !== null) bonus -= 0.15;
      else if (entry.numbers.has(p)) bonus += 0.1;
    }
    for (const s of query.sizes) {
      if (entry.sizes.some((e) => sameSize(e, s))) bonus += 0.15;
      else if (entry.sizes.length) bonus -= 0.1;
    }
    for (const n of query.numbers) {
      if (price === n || entry.numbers.has(n) || entry.sizes.some((e) => e.value === n)) bonus += 0.1;
    }
    return bonus;
  }

  /**
   * Whether a spoken word is a product word in the master, for the order parser. Only confident,
   * longer matches count so background talk ("कधी", "तू") is not taken for a product.
   */
  readonly isKnownWord = (token: string): boolean => {
    const cached = this.knownCache.get(token);
    if (cached !== undefined) return cached;
    let known = false;
    if (isDevanagari(token)) {
      const letters = spelledLetters(token);
      if (letters) known = letters.length > 1 || this.letters.has(letters.toUpperCase());
      else if (synonymsOf(token).length) known = true;
      else {
        const key = keyOf(token);
        // Short words ("बाम" = BALM, "रिन" = RIN) only when they sound exactly like a master word.
        if (key.skeleton.length === 2 && key.full.length >= 3) known = this.vocab.some((v) => v.key.full === key.full);
        else if (key.skeleton.length >= 3) {
          known = this.vocab.some(
            (v) => v.key.skeleton.length >= 3 && similarity(key, v.key) >= 0.85 && fullRatio(key, v.key) >= 0.8,
          );
        }
      }
    }
    if (this.knownCache.size > 20000) this.knownCache.clear();
    this.knownCache.set(token, known);
    return known;
  };
}

const fullRatio = (a: WordKey, b: WordKey) => 1 - editDistance(a.full, b.full) / Math.max(a.full.length, b.full.length, 1);

/** "100ml", "500gm", "1kg" typed in Latin letters, or "100" followed by "ml". */
function latinSize(tok: string, next?: string): Size | undefined {
  const fused = tok.toUpperCase().match(/^(\d+(?:\.\d+)?)(ML|GM|G|KG|LTR|L)$/);
  if (fused) return { value: parseFloat(fused[1]), unitCode: MEASURE[fused[2]] };
  if (/^\d+(\.\d+)?$/.test(tok) && next && MEASURE[next.toUpperCase()]) {
    return { value: parseFloat(tok), unitCode: MEASURE[next.toUpperCase()] };
  }
  return undefined;
}

function synonymsOf(word: string): string[] {
  const direct = marathiSynonyms(word);
  if (direct) return direct;
  const en = PRODUCT_EN[word];
  return en ? en.toUpperCase().split(/\s+/) : [];
}
