import { pool } from "../../db/pool.js";
import type { OrderItem } from "../voice/parser.js";
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
