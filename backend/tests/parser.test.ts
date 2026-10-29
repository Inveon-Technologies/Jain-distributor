import { describe, expect, it } from "vitest";
import { readQuantity } from "../src/modules/voice/numbers.js";
import { formatOrderText, parseOrderText, summarizeItems } from "../src/modules/voice/parser.js";

const pick = (text: string) => parseOrderText(text).items.map((i) => [i.name, i.quantity, i.unitCode]);

describe("parseOrderText", () => {
  it("parses the PRD example order", () => {
    const result = parseOrderText(
      "दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स.",
    );
    expect(result.items.map((i) => [i.name, i.quantity, i.unitCode, i.nameEn])).toEqual([
      ["रवा", 10, "KG", "Rava"],
      ["पार्ले बिस्किट", 20, "PACKET", "Parle Biscuit"],
      ["गूळ", 50, "KG", "Jaggery"],
      ["डाबर टूथपेस्ट", 5, "BOX", "Dabur Toothpaste"],
    ]);
    expect(result.unparsed).toEqual([]);
    expect(summarizeItems(result.items)).toBe(
      "रवा – 10 किलो | पार्ले बिस्किट – 20 पॅकेट | गूळ – 50 किलो | डाबर टूथपेस्ट – 5 बॉक्स",
    );
  });

  it("keeps the frontend unit label format", () => {
    expect(parseOrderText("पाच लिटर शेंगदाणा तेल").items[0]).toMatchObject({
      name: "शेंगदाणा तेल",
      nameEn: "Groundnut Oil",
      quantity: 5,
      unit: "लिटर (Ltr)",
    });
  });

  it("ignores filler words such as द्या / पाहिजे", () => {
    expect(pick("दहा किलो साखर आणि पाच किलो तांदूळ द्या.")).toEqual([
      ["साखर", 10, "KG"],
      ["तांदूळ", 5, "KG"],
    ]);
    expect(pick("मला दोन डझन अंडी पाहिजेत")).toEqual([["अंडी", 2, "DOZEN"]]);
  });

  it("reads digits, Devanagari digits and fused number+unit tokens", () => {
    expect(pick("10kg साखर, १२ पॅकेट पोहे, 2.5 लिटर तेल, १०किलो मैदा")).toEqual([
      ["साखर", 10, "KG"],
      ["पोहे", 12, "PACKET"],
      ["तेल", 2.5, "LITRE"],
      ["मैदा", 10, "KG"],
    ]);
  });

  it("handles fractions and compound numbers", () => {
    expect(pick("अडीच किलो जिरे, साडे तीन किलो हळद, सव्वा दोन किलो मिरची, पाव किलो मोहरी")).toEqual([
      ["जिरे", 2.5, "KG"],
      ["हळद", 3.5, "KG"],
      ["मिरची", 2.25, "KG"],
      ["मोहरी", 0.25, "KG"],
    ]);
    expect(pick("पाचशे ग्रॅम चहा पावडर")).toEqual([["चहा पावडर", 500, "GRAM"]]);
    expect(pick("दोन हजार पाचशे नग काडेपेटी")).toEqual([["काडेपेटी", 2500, "PIECE"]]);
  });

  it("splits run-on speech without separators", () => {
    expect(pick("दहा किलो रवा पाच किलो साखर")).toEqual([
      ["रवा", 10, "KG"],
      ["साखर", 5, "KG"],
    ]);
  });

  it("defaults the unit to pieces and reports segments without a quantity", () => {
    const result = parseOrderText("तीन साबण, आणि थोडे शेंगदाणे");
    expect(result.items.map((i) => [i.name, i.quantity, i.unitCode])).toEqual([["साबण", 3, "PIECE"]]);
    expect(result.unparsed).toEqual(["थोडे शेंगदाणे"]);
  });

  it("supports English speech", () => {
    expect(pick("5 kg sugar and 10 packets biscuit")).toEqual([
      ["sugar", 5, "KG"],
      ["biscuit", 10, "PACKET"],
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(parseOrderText("   ")).toEqual({ items: [], unparsed: [] });
  });
});

describe("readQuantity", () => {
  it.each([
    [["वीस"], 20],
    [["पंचवीस"], 25],
    [["शंभर"], 100],
    [["दोनशे", "पन्नास"], 250],
    [["दीड"], 1.5],
    [["पावणे", "दोन"], 1.75],
    [["साडेतीन"], 3.5],
    [["हजार"], 1000],
  ])("%j → %d", (tokens, expected) => {
    expect(readQuantity(tokens, 0)?.value).toBe(expected);
  });

  it("returns undefined for non-numbers", () => {
    expect(readQuantity(["रवा"], 0)).toBeUndefined();
  });
});

describe("spoken kirana orders without separators", () => {
  const spoken =
    "एक किलो रवा एक किलो पिठीसाखर दोन किलो खोबरं चार किलो कांदे लसूण पाच किलो शेंगदाणा शेंगदाणे तीन किलो आले पावशेर चार जुडी कोथिंबीर";

  it("splits every item with a numeric quantity", () => {
    const { items, unparsed } = parseOrderText(spoken);
    expect(items.map((i) => [i.name, i.quantity, i.unitCode])).toEqual([
      ["रवा", 1, "KG"],
      ["पिठीसाखर", 1, "KG"],
      ["खोबरं", 2, "KG"],
      ["कांदे लसूण", 4, "KG"],
      ["शेंगदाणा", 5, "KG"],
      ["आले", 3, "KG"],
      ["कोथिंबीर", 4, "BUNCH"],
    ]);
    // A quantity with no product is kept for the salesperson to fix.
    expect(unparsed).toEqual(["250 ग्रॅम"]);
  });

  it("reads पावशेर as 250 g", () => {
    expect(parseOrderText("आले पावशेर").items).toEqual([
      { name: "आले", nameEn: "Ginger", quantity: 250, unit: "ग्रॅम (g)", unitCode: "GRAM" },
    ]);
  });

  it("formats one item per line with digits, and the text parses back to the same items", () => {
    const parsed = parseOrderText(spoken);
    const text = formatOrderText(parsed);
    expect(text.split("\n").slice(0, 2)).toEqual(["रवा 1 किलो", "पिठीसाखर 1 किलो"]);
    expect(text).not.toMatch(/[,.।]/);
    expect(parseOrderText(text).items).toEqual(parsed.items);
  });
});
