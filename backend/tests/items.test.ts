import { describe, expect, it } from "vitest";
import { normalizeUnit, parseItemList, toItemCsv } from "../src/modules/items/importer.js";
import { ItemMatcher, type CatalogItem } from "../src/modules/items/matcher.js";
import { keepMasterItems, withSuggestions } from "../src/modules/items/catalog.js";
import { keyOf, similarity } from "../src/modules/voice/phonetic.js";
import { formatOrderText, parseOrderText } from "../src/modules/voice/parser.js";

describe("item list import", () => {
  it("cleans names, packing and prices", () => {
    const { items, skipped } = parseItemList(
      [
        "item_name\titem_size",
        "                              \tPCS",
        "BABOOL PAST RS : 73\tPCS",
        "CHIKKI  RS 5\tPKT 30",
        "CHIKKI RS 5\tPKT 30",
        "CAMPHOR BRASS RS 199/-\tJAR",
        "ACO SPRAY 40 ML 196\tPCS",
        "CASH\tPCS",
        "AMBER SMOOTH POLY (0.50) FREE\tPACKET",
        "( a note at the end of the file )",
      ].join("\n"),
    );
    expect(items.map((i) => [i.name, i.unit, i.price])).toEqual([
      ["BABOOL PAST RS 73", "PCS", 73],
      ["CHIKKI RS 5", "PKT 30", 5],
      ["CAMPHOR BRASS RS 199", "JAR", 199],
      ["ACO SPRAY 40 ML 196", "PCS", 196],
      ["AMBER SMOOTH POLY (0.50) FREE", "PKT", null],
    ]);
    // The first line is read as the header (item_name / item_size columns).
    expect(skipped.map((s) => s.reason)).toEqual([
      "No item name",
      "Duplicate",
      "Not an item",
      "Not in name<TAB>packing format",
    ]);
  });

  it.each([
    ["PKT 30", "PKT 30", "PKT", 30, null],
    ["PACKET", "PKT", "PKT", null, null],
    ["PCKET", "PKT", "PKT", null, null],
    ["PKT24", "PKT 24", "PKT", 24, null],
    ["PATI6+2", "PATTI 6+2", "PATTI", 6, 2],
    ["JAR 58+2", "JAR 58+2", "JAR", 58, 2],
    ["1KG", "1 KG", "KG", null, null],
    ["KG 1", "1 KG", "KG", null, null],
    ["PKT 500 GM", "PKT 500 GM", "PKT", null, null],
    ["PACKET(40)", "PKT 40", "PKT", 40, null],
    ["DOZ ", "DOZ", "DOZ", null, null],
    ["", "PCS", "PCS", null, null],
  ])("packing %j → %j", (raw, unit, packType, packQty, freeQty) => {
    expect(normalizeUnit(raw)).toEqual({ unit, packType, packQty, freeQty });
  });
});

describe("item master CSV", () => {
  it("reads header columns, quoted names and spoken names", () => {
    const csv = [
      "\uFEFFname,packing,mrp,marathi_name,spoken_names,status",
      '"PARLE G, FAMILY PACK RS 50",PKT 12,"55",पार्ले जी फॅमिली,"पार्ले मोठा | फॅमिली पार्ले",inactive',
      "LUX SOAP RS 10,PCS,,,,",
      "BAD PRICE,PCS,abc,,,",
    ].join("\r\n");
    const { items, skipped, columns } = parseItemList(csv);
    expect(columns).toEqual(["price", "marathiName", "aliases", "status"]);
    expect(items[0]).toMatchObject({
      name: "PARLE G, FAMILY PACK RS 50",
      unit: "PKT 12",
      price: 55,
      marathiName: "पार्ले जी फॅमिली",
      aliases: ["पार्ले मोठा", "फॅमिली पार्ले"],
      status: "INACTIVE",
    });
    // An empty MRP falls back to "RS 10" in the name.
    expect(items[1]).toMatchObject({ name: "LUX SOAP RS 10", price: 10, marathiName: null, aliases: [] });
    expect(skipped).toEqual([{ line: 4, text: "BAD PRICE,PCS,abc,,,", reason: 'Price "abc" is not a number' }]);
  });

  it("round-trips through the export format", () => {
    const rows = [{ name: 'A "B", C', unit: "PKT 30", price: 5, marathiName: "ए बी", aliases: ["एक", "दोन"], status: "ACTIVE" }];
    const back = parseItemList(toItemCsv(rows)).items[0];
    expect(back).toMatchObject({ name: 'A "B", C', unit: "PKT 30", price: 5, marathiName: "ए बी", aliases: ["एक", "दोन"], status: "ACTIVE" });
  });

  it("still reads name,packing lines without a header, with commas in the name", () => {
    expect(parseItemList("SOAP, BIG RS 10,PCS").items[0]).toMatchObject({ name: "SOAP, BIG RS 10", unit: "PCS" });
  });
});

describe("sound-alike keys", () => {
  it.each([
    ["पार्ले", "PARLE"],
    ["कोलगेट", "COLGATE"],
    ["व्हॅसलीन", "VASELINE"],
    ["पॅराशूट", "PARACHUTE"],
    ["शॅम्पू", "SHAMPOO"],
    ["जिलेट", "GILLETTE"],
    ["झंडू", "ZANDU"],
    ["टाईड", "TIDE"],
    ["मॅगी", "MAGGI"],
    ["लोशन", "LOTION"],
    ["एमडीएच", "MDH"],
    ["जी", "G"],
  ])("%s sounds like %s", (mr, en) => {
    expect(similarity(keyOf(mr), keyOf(en))).toBeGreaterThanOrEqual(0.75);
  });

  it("keeps different words apart", () => {
    expect(similarity(keyOf("कोलगेट"), keyOf("COLIN"))).toBeLessThan(0.7);
    expect(similarity(keyOf("तू"), keyOf("TOY"))).toBeLessThan(0.7);
  });
});

const catalog: CatalogItem[] = [
  "PARLE G RS 5",
  "PARLE G RS 10",
  "PARLE MONACO RS 10",
  "COLGATE PASTE RS 10",
  "COLGATE PASTE RS 20",
  "COLGATE BRUSH RS 25",
  "NIVEA CREAM RS 35",
  "NIVEA DEO RS 199",
  "LUX SOAP RS 10",
  "DETTOL SOAP RS 10",
  "HIMALAYA BABY SOAP RS 36",
  "ACO SPRAY 40 ML 196",
  "ACO SPRAY 100 ML RS 320",
  "ZANDU BALM RS 45",
  "CAMPHOR POUCH RS 15",
  "COMFORT RS 58",
  "GODREJ NO 1 RS 5",
].map((name, i) => ({
  id: String(i),
  name,
  marathiName: null,
  aliases: name === "LUX SOAP RS 10" ? ["लक्स गुलाबी"] : [],
  unit: "PCS",
  packType: "PCS",
  price: Number(name.match(/RS (\d+)/)?.[1] ?? name.match(/ (\d+)$/)?.[1] ?? NaN) || null,
}));
const matcher = new ItemMatcher(catalog);
const top = (q: string) => matcher.suggest(q)[0]?.name;

describe("ItemMatcher", () => {
  it.each([
    ["पार्ले जी ₹10", "PARLE G RS 10"],
    ["पार्ले जी ₹5", "PARLE G RS 5"],
    ["कोलगेट पेस्ट ₹20", "COLGATE PASTE RS 20"],
    ["कोलगेट ब्रश", "COLGATE BRUSH RS 25"],
    ["निव्हिया क्रीम", "NIVEA CREAM RS 35"],
    ["निव्हिया डिओ", "NIVEA DEO RS 199"],
    ["डेटॉल साबण", "DETTOL SOAP RS 10"],
    ["बाळाचा साबण", "HIMALAYA BABY SOAP RS 36"],
    ["एको स्प्रे 100मिली", "ACO SPRAY 100 ML RS 320"],
    ["झंडू बाम", "ZANDU BALM RS 45"],
    ["कापूर", "CAMPHOR POUCH RS 15"],
    ["गोदरेज नंबर वन", "GODREJ NO 1 RS 5"],
    ["लक्स गुलाबी", "LUX SOAP RS 10"],
    ["colgate paste 20", "COLGATE PASTE RS 20"],
  ])("%s → %s", (spoken, name) => {
    expect(top(spoken)).toBe(name);
  });

  it("suggests nothing for words that match no item", () => {
    expect(matcher.suggest("नमस्कार")).toEqual([]);
  });

  it("picks the item only when it is a confident match", () => {
    const parsed = parseOrderText("पार्ले जी दहा रुपये वीस पॅकेट, पाच किलो नमस्कार", { isKnownWord: matcher.isKnownWord });
    const [parle, other] = withSuggestions(parsed.items, matcher);
    expect(parle).toMatchObject({ itemName: "PARLE G RS 10", nameEn: "PARLE G RS 10", quantity: 20 });
    expect(other.itemId).toBeUndefined();
  });

  it("keeps only lines that are Item Master products", () => {
    const parsed = parseOrderText("दोन पॅकेट पार्ले जी, पाच किलो रवा, थोडे कोलगेट, थोडे शेंगदाणे", { isKnownWord: matcher.isKnownWord });
    const result = keepMasterItems(parsed, matcher);
    expect(result.items.map((i) => i.itemName)).toEqual(["PARLE G RS 5"]);
    expect(result.unparsed).toEqual(["थोडे कोलगेट"]);
    expect(result.notInMaster).toEqual(["रवा 5 किलो", "थोडे शेंगदाणे"]);
    expect(result.ignored).toEqual(expect.arrayContaining(result.notInMaster));
    // An empty master keeps everything, so a new install still records orders.
    expect(keepMasterItems(parsed, new ItemMatcher([])).items).toHaveLength(2);
  });

  it("knows Item Master words so they are not dropped as background talk", () => {
    const text = "दहा किलो रवा अरे तू कधी आलास चार निव्हिया क्रीम दोन मिनिटात येतो";
    expect(parseOrderText(text).items.map((i) => i.name)).toEqual(["रवा"]);
    const withMaster = parseOrderText(text, { isKnownWord: matcher.isKnownWord });
    expect(withMaster.items.map((i) => [i.name, i.quantity])).toEqual([
      ["रवा", 10],
      ["निव्हिया क्रीम", 4],
    ]);
    expect(withMaster.ignored).toEqual(["अरे तू कधी आलास", "दोन मिनिटात येतो"]);
    expect(parseOrderText("तीन नग झंडू बाम", { isKnownWord: matcher.isKnownWord }).items[0].name).toBe("झंडू बाम");
  });
});

describe("prices and pack sizes in spoken orders", () => {
  const pick = (text: string) => parseOrderText(text).items.map((i) => [i.name, i.quantity, i.unitCode]);

  it("reads 'दहा रुपये' as the price, not the quantity", () => {
    expect(pick("पार्ले जी दहा रुपये वीस पॅकेट")).toEqual([["पार्ले जी ₹10", 20, "PACKET"]]);
    expect(pick("दहाचे पार्ले जी वीस पुडे")).toEqual([["पार्ले जी ₹10", 20, "PACK"]]);
    expect(pick("कोलगेट पेस्ट वीस रुपयांची दहा नग")).toEqual([["कोलगेट पेस्ट ₹20", 10, "PIECE"]]);
  });

  it("keeps a pack size in the name when a count follows or precedes it", () => {
    expect(pick("शाम्पू शंभर मिली दोन नग")).toEqual([["शाम्पू 100मिली", 2, "PIECE"]]);
    expect(pick("दोन बॉक्स शाम्पू शंभर एमएल")).toEqual([["शाम्पू 100मिली", 2, "BOX"]]);
    // Without a count the weight is still the quantity.
    expect(pick("पाचशे ग्रॅम चहा पावडर")).toEqual([["चहा पावडर", 500, "GRAM"]]);
  });

  it("formatted text parses back to the same items", () => {
    const parsed = parseOrderText("पार्ले जी दहा रुपये वीस पॅकेट आणि शाम्पू शंभर मिली दोन नग");
    expect(formatOrderText(parsed)).toBe("पार्ले जी ₹10 20 पॅकेट\nशाम्पू 100मिली 2 नग");
    expect(parseOrderText(formatOrderText(parsed)).items).toEqual(parsed.items);
  });
});
