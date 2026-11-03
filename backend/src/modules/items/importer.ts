/**
 * Reads the shop's item list (one item per line: name <TAB> packing, as exported from the billing
 * software) into clean Item Master rows.
 *
 *   "ACO SPRAY 40 ML 196 \t PCS"   → ACO SPRAY 40 ML 196 | PCS        | price 196
 *   "BABOOL PAST RS : 73\tPCS"     → BABOOL PAST RS 73   | PCS        | price 73  ("RS 199/-" → RS 199)
 *   "3 STIX MILK RS 5\tPKT 33"     → 3 STIX MILK RS 5    | PKT 33     | price 5, 33 per packet
 *   "...\tPACKET" / "PCKET" / "PK" → PKT;  "PATI6+2" → PATTI 6+2;  "1KG" → 1 KG
 *
 * Blank names, the header row, exact duplicates and non-items ("CASH") are skipped.
 */

export interface ItemRow {
  name: string;
  unit: string;
  packType: string;
  packQty: number | null;
  freeQty: number | null;
  price: number | null;
}

export interface ImportResult {
  items: ItemRow[];
  skipped: { line: number; text: string; reason: string }[];
}

/** Packing words as typed in the list → one spelling each. */
const PACK_ALIASES: Record<string, string> = {
  PCS: "PCS", PC: "PCS", PIECE: "PCS", PIECES: "PCS", NOS: "PCS", UNIT: "UNIT",
  PKT: "PKT", PACKET: "PKT", PACKETS: "PKT", PCKET: "PKT", PK: "PKT", PACK: "PKT",
  JAR: "JAR", BOX: "BOX", DOZ: "DOZ", DOZEN: "DOZ",
  PATTI: "PATTI", PATI: "PATTI", STRIP: "PATTI",
  GATTU: "GATTU", GAATU: "GATTU", BAG: "BAG", TRAY: "TRAY", DABBA: "DABBA", DABA: "DABBA",
  PAN: "PAN", PUDA: "PUDA", POUCH: "POUCH", TIN: "TIN", CAN: "CAN", GROSS: "GROSS",
  BOTTLE: "BOTTLE", BOTTEL: "BOTTLE", BANDAL: "BUNDLE", BUNDLE: "BUNDLE",
  COMBO: "COMBO", COMBI: "COMBO", COM: "COMBO",
};

/** Weight / volume words → one spelling each. */
const MEASURE_ALIASES: Record<string, string> = {
  KG: "KG", KGS: "KG", G: "GM", GM: "GM", GMS: "GM", GRAM: "GM", GRAMS: "GM", ML: "ML", LTR: "LTR",
  L: "LTR", LITRE: "LTR", LITER: "LTR",
};

/** Lines in the export that are not things a shop can order. */
const NOT_ITEMS = new Set(["CASH", "ITEM_NAME", "ITEM NAME"]);

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

/** "babool past rs : 73 " → "BABOOL PAST RS 73"; "( 0.50 )" → "(0.50)". */
export function cleanItemName(raw: string): string {
  return squash(
    raw
      .toUpperCase()
      .replace(/\bRS\s*[:.-]?\s*(?=\d)/g, "RS ")
      .replace(/(\d)\s*\/-/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")"),
  );
}

/** MRP printed in the name: "RS 20" → 20; "ACO SPRAY 40 ML 196" → 196 (a number after the size). */
export function priceOf(name: string): number | null {
  const rs = name.match(/\bRS (\d+(?:\.\d+)?)/);
  if (rs) return parseFloat(rs[1]);
  const trailing = name.match(/\b\d+(?:\.\d+)? ?(?:ML|GM|G|KG|LTR)\b\s+(\d+(?:\.\d+)?)$/);
  return trailing ? parseFloat(trailing[1]) : null;
}

/** "PKT24" → PKT 24, "1KG" → 1 KG, "PATI6+2" → PATTI 6+2, "PACKET(40)" → PKT 40, "" → PCS. */
export function normalizeUnit(raw: string): Pick<ItemRow, "unit" | "packType" | "packQty" | "freeQty"> {
  const tokens = squash(
    raw
      .toUpperCase()
      .replace(/[()]/g, " ")
      .replace(/\s*([+*])\s*/g, "$1")
      .replace(/([A-Z])(?=\d)/g, "$1 ")
      .replace(/(\d)(?=[A-Z])/g, "$1 "),
  )
    .split(" ")
    .filter(Boolean);

  let packType: string | undefined;
  let packQty: number | null = null;
  let freeQty: number | null = null;
  let count: string | undefined;
  let measure: string | undefined;
  const rest: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const next = tokens[i + 1];
    if (/^\d+(\.\d+)?$/.test(tok) && next && MEASURE_ALIASES[next] && !measure) {
      measure = `${tok} ${MEASURE_ALIASES[next]}`;
      i++;
      continue;
    }
    if (PACK_ALIASES[tok] && !packType) {
      packType = PACK_ALIASES[tok];
      continue;
    }
    if (MEASURE_ALIASES[tok] && !packType && !measure) {
      // "KG 1" / bare "KG": sold by weight.
      packType = MEASURE_ALIASES[tok];
      continue;
    }
    const qty = tok.match(/^(\d+)(?:\+(\d+))?$/);
    if (qty && count === undefined) {
      count = tok;
      packQty = parseInt(qty[1], 10);
      freeQty = qty[2] ? parseInt(qty[2], 10) : null;
      continue;
    }
    rest.push(PACK_ALIASES[tok] ?? MEASURE_ALIASES[tok] ?? tok);
  }

  if (!packType && measure) packType = measure.split(" ")[1];
  packType ??= "PCS";
  // "KG 1" means one kilo, not "a KG of 1".
  if ((packType === "KG" || packType === "GM" || packType === "LTR" || packType === "ML") && count && !measure && !freeQty) {
    measure = `${count} ${packType}`;
    count = undefined;
    packQty = null;
  }
  const parts =
    measure && packType === measure.split(" ")[1] ? [measure, count, ...rest] : [packType, count, measure, ...rest];
  return { unit: parts.filter(Boolean).join(" "), packType, packQty, freeQty };
}

/** Parses the pasted / uploaded list. Accepts tab-separated or comma-separated lines. */
export function parseItemList(text: string): ImportResult {
  const items: ItemRow[] = [];
  const skipped: ImportResult["skipped"] = [];
  const seen = new Set<string>();
  const tabbed = text.includes("\t");

  text.split(/\r?\n/).forEach((line, index) => {
    const lineNo = index + 1;
    if (!line.trim()) return;
    if (tabbed && !line.includes("\t")) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "Not in name<TAB>packing format" });
      return;
    }
    const [rawName, rawUnit = ""] = tabbed ? line.split("\t") : splitCsv(line);
    const name = cleanItemName(rawName ?? "");
    if (!name) {
      skipped.push({ line: lineNo, text: line.trim(), reason: "No item name" });
      return;
    }
    if (NOT_ITEMS.has(name)) {
      skipped.push({ line: lineNo, text: line.trim(), reason: "Not an item" });
      return;
    }
    if (name.length > 200) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "Name is longer than 200 characters" });
      return;
    }
    const unit = normalizeUnit(rawUnit);
    const key = `${name}|${unit.unit}`;
    if (seen.has(key)) {
      skipped.push({ line: lineNo, text: line.trim(), reason: "Duplicate" });
      return;
    }
    seen.add(key);
    items.push({ name, ...unit, price: priceOf(name) });
  });
  return { items, skipped };
}

/** "NAME, PKT 30" or "\"NAME, WITH COMMA\",PCS". */
function splitCsv(line: string): string[] {
  const m = line.match(/^\s*"((?:[^"]|"")*)"\s*,(.*)$/);
  if (m) return [m[1].replace(/""/g, '"'), m[2]];
  const comma = line.lastIndexOf(",");
  return comma === -1 ? [line] : [line.slice(0, comma), line.slice(comma + 1)];
}
