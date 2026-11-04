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
  /** Only when the file has these columns (an Item Master export, for example). */
  marathiName?: string | null;
  aliases?: string[];
  status?: "ACTIVE" | "INACTIVE";
}

export interface ImportResult {
  items: ItemRow[];
  /** Optional columns the file has (price, marathiName, aliases, status). */
  columns: string[];
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

/** Header names accepted for each column (lower case). Files without a header are name, packing. */
const COLUMNS: Record<"name" | "unit" | "price" | "marathiName" | "aliases" | "status", string[]> = {
  name: ["name", "item_name", "item name", "item", "आयटम", "नाव"],
  unit: ["unit", "packing", "item_size", "item size", "size", "pack", "पॅकिंग"],
  price: ["price", "mrp", "rate", "किंमत"],
  marathiName: ["marathi_name", "marathi name", "marathi", "मराठी नाव"],
  aliases: ["aliases", "spoken_names", "spoken names", "बोलण्याची नावे"],
  status: ["status", "स्थिती"],
};

type ColumnMap = Partial<Record<keyof typeof COLUMNS, number>>;

function headerOf(cells: string[]): ColumnMap | undefined {
  const lower = cells.map((c) => c.trim().toLowerCase());
  const map: ColumnMap = {};
  for (const [key, names] of Object.entries(COLUMNS) as [keyof typeof COLUMNS, string[]][]) {
    const idx = lower.findIndex((c) => names.includes(c));
    if (idx !== -1) map[key] = idx;
  }
  return map.name !== undefined ? map : undefined;
}

/** One CSV line with quoted fields ("A, B",PCS). */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"' && !cur.trim()) {
      quoted = true;
      cur = "";
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells;
}

/**
 * Parses the pasted / uploaded list. Accepts tab-separated or comma-separated lines: either
 * name + packing per line (the billing export), or any columns under a header row such as the
 * Item Master export (name, packing, mrp, marathi_name, spoken_names, status).
 */
export function parseItemList(text: string): ImportResult {
  const items: ItemRow[] = [];
  const skipped: ImportResult["skipped"] = [];
  const seen = new Set<string>();
  const clean = text.replace(/^\uFEFF/, "");
  const tabbed = clean.includes("\t");
  let header: ColumnMap | undefined;
  let sawRow = false;

  clean.split(/\r?\n/).forEach((line, index) => {
    const lineNo = index + 1;
    if (!line.trim()) return;
    if (tabbed && !line.includes("\t")) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "Not in name<TAB>packing format" });
      return;
    }
    const cells = tabbed ? line.split("\t") : splitCsvLine(line);
    if (!sawRow) {
      sawRow = true;
      header = headerOf(cells);
      if (header) return;
    }
    // Without a header, an unquoted name may itself contain commas: the packing is the last field.
    const columns = header ?? { name: 0, unit: 1 };
    const row = header || tabbed || cells.length <= 2 ? cells : [cells.slice(0, -1).join(","), cells.at(-1)!];
    const cell = (key: keyof typeof COLUMNS) => {
      const idx = columns[key];
      return idx === undefined ? undefined : (row[idx] ?? "").trim();
    };

    const name = cleanItemName(cell("name") ?? "");
    if (!name) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "No item name" });
      return;
    }
    if (NOT_ITEMS.has(name)) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "Not an item" });
      return;
    }
    if (name.length > 200) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "Name is longer than 200 characters" });
      return;
    }
    const unit = normalizeUnit(cell("unit") ?? "");
    const key = `${name}|${unit.unit}`;
    if (seen.has(key)) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: "Duplicate" });
      return;
    }

    const rawPrice = cell("price")?.replace(/^(₹|rs\.?)\s*/i, "").replace(/,/g, "");
    const price = rawPrice ? Number(rawPrice) : NaN;
    if (rawPrice && (!Number.isFinite(price) || price < 0)) {
      skipped.push({ line: lineNo, text: line.trim().slice(0, 80), reason: `Price "${rawPrice}" is not a number` });
      return;
    }
    const row_: ItemRow = { name, ...unit, price: rawPrice ? price : priceOf(name) };
    const marathi = cell("marathiName");
    if (marathi !== undefined) row_.marathiName = marathi.slice(0, 200) || null;
    const aliases = cell("aliases");
    if (aliases !== undefined) {
      row_.aliases = [...new Set(aliases.split(/[|;]/).map((a) => a.trim()).filter(Boolean))]
        .map((a) => a.slice(0, 100))
        .slice(0, 50);
    }
    const st = cell("status")?.toUpperCase();
    if (st) row_.status = st === "INACTIVE" || st === "बंद" ? "INACTIVE" : "ACTIVE";

    seen.add(key);
    items.push(row_);
  });
  const columns = header ? (["price", "marathiName", "aliases", "status"] as const).filter((k) => header![k] !== undefined) : [];
  return { items, skipped, columns: [...columns] };
}

const csvCell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of the Item Master, re-importable with parseItemList. Starts with a BOM so Excel reads Marathi. */
export function toItemCsv(
  rows: { name: string; unit: string; price: number | null; marathiName: string | null; aliases: string[]; status: string }[],
): string {
  const lines = [["name", "packing", "mrp", "marathi_name", "spoken_names", "status"].join(",")];
  for (const r of rows) {
    lines.push([r.name, r.unit, r.price, r.marathiName, r.aliases.join(" | "), r.status].map(csvCell).join(","));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
