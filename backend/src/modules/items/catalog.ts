import { pool } from "../../db/pool.js";
import { formatOrderText, type OrderItem, type ParseResult } from "../voice/parser.js";
import { AUTO_MATCH_SCORE, ItemMatcher, type CatalogItem, type Suggestion } from "./matcher.js";

/**
 * The active Item Master, indexed for voice matching. Built once and reused; any change to items
 * through the API drops it, and it is rebuilt at most every few minutes otherwise (so a second API
 * replica picks up changes too).
 */

const TTL_MS = 5 * 60 * 1000;
let cached: { matcher: ItemMatcher; at: number } | undefined;
let loading: Promise<ItemMatcher> | undefined;

async function load(): Promise<ItemMatcher> {
  const { rows } = await pool.query<CatalogItem>(
    `SELECT id, name, marathi_name AS "marathiName", aliases, unit, pack_type AS "packType", price
       FROM items WHERE deleted_at IS NULL AND status = 'ACTIVE'`,
  );
  return new ItemMatcher(rows);
}

export async function itemMatcher(): Promise<ItemMatcher> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.matcher;
  loading ??= load()
    .then((matcher) => {
      cached = { matcher, at: Date.now() };
      return matcher;
    })
    .finally(() => {
      loading = undefined;
    });
  return loading;
}

export function invalidateItemCatalog() {
  cached = undefined;
}

export interface MatchedOrderItem extends OrderItem {
  /** Item Master entry picked for this line (best suggestion when it is a confident match). */
  itemId?: string;
  itemName?: string;
  itemUnit?: string;
  /** Best Item Master candidates, for the salesperson to choose from on the review screen. */
  suggestions: Suggestion[];
}

/** Adds Item Master suggestions to parsed order lines and picks the best one when confident. */
export function withSuggestions(items: OrderItem[], matcher: ItemMatcher): MatchedOrderItem[] {
  return items.map((item) => {
    const suggestions = matcher.suggest(item.name, { unitCode: item.unitCode });
    const top = suggestions[0];
    if (!top || top.score < AUTO_MATCH_SCORE) return { ...item, suggestions };
    return { ...item, nameEn: top.name, itemId: top.id, itemName: top.name, itemUnit: top.unit, suggestions };
  });
}

/**
 * Below this score a line is not taken for any Item Master product. Lower than AUTO_MATCH_SCORE:
 * a likely product stays on the order with its suggestions for the salesperson to confirm.
 */
export const KEEP_SCORE = 0.45;

export interface MasterParseResult extends Omit<ParseResult, "items"> {
  items: MatchedOrderItem[];
  /** Lines with a quantity that match nothing in the Item Master (also listed in `ignored`). */
  notInMaster: string[];
}

/**
 * Keeps only order lines that are Item Master products. Other lines, such as a number in
 * background talk ("दोन नमस्कार किलो") or a product the distributor does not sell, move to
 * `ignored` (the app shows them with an "add back" button). With an empty master every line is
 * kept, so a fresh install still works.
 */
export function keepMasterItems(parsed: ParseResult, matcher: ItemMatcher): MasterParseResult {
  const items = withSuggestions(parsed.items, matcher);
  if (!matcher.size) return { ...parsed, items, notInMaster: [] };
  const kept: MatchedOrderItem[] = [];
  const notInMaster: string[] = [];
  // A line is a master product when an item scores well, or when one of its words is clearly a
  // master word heard by name ("मोठा कोलगेट" when "मोठा" pulls the score down).
  const isProduct = (text: string, score: number) =>
    score >= KEEP_SCORE || text.split(/\s+/).some(matcher.soundsLikeMasterWord);
  for (const item of items) {
    if (isProduct(item.name, item.suggestions[0]?.score ?? 0)) kept.push(item);
    else notInMaster.push(formatOrderText({ items: [item], unparsed: [], ignored: [] }));
  }
  const unparsed: string[] = [];
  for (const part of parsed.unparsed) {
    if (isProduct(part, matcher.suggest(part, { limit: 1 })[0]?.score ?? 0)) unparsed.push(part);
    else notInMaster.push(part);
  }
  return { items: kept, unparsed, ignored: [...parsed.ignored, ...notInMaster], notInMaster };
}
