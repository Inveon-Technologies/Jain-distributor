/**
 * Marathi number words → numeric values, used to read quantities out of spoken orders
 * ("दहा किलो रवा" → 10 kg Rava). Covers 0–100 plus hundreds ("पाचशे"), thousands ("हजार")
 * and the common fractional forms used in trade (दीड, अडीच, साडे, सव्वा, पावणे, अर्धा, पाव).
 */

export const UNITS_TO_HUNDRED: Record<string, number> = {
  शून्य: 0,
  एक: 1, दोन: 2, तीन: 3, चार: 4, पाच: 5, सहा: 6, साहा: 6, सात: 7, आठ: 8, नऊ: 9, नउ: 9, दहा: 10,
  अकरा: 11, बारा: 12, तेरा: 13, चौदा: 14, पंधरा: 15, सोळा: 16, सतरा: 17, अठरा: 18, एकोणीस: 19, एकोणवीस: 19,
  वीस: 20, विस: 20, एकवीस: 21, बावीस: 22, तेवीस: 23, चोवीस: 24, पंचवीस: 25, सव्वीस: 26, सत्तावीस: 27,
  अठ्ठावीस: 28, एकोणतीस: 29, तीस: 30, एकतीस: 31, बत्तीस: 32, तेहेतीस: 33, तेहतीस: 33, चौतीस: 34, पस्तीस: 35,
  छत्तीस: 36, सदतीस: 37, अडतीस: 38, एकोणचाळीस: 39, चाळीस: 40, एक्केचाळीस: 41, बेचाळीस: 42, त्रेचाळीस: 43,
  चव्वेचाळीस: 44, पंचेचाळीस: 45, सेहेचाळीस: 46, सत्तेचाळीस: 47, अठ्ठेचाळीस: 48, एकोणपन्नास: 49, पन्नास: 50,
  एक्कावन्न: 51, बावन्न: 52, त्रेपन्न: 53, चोपन्न: 54, पंचावन्न: 55, छप्पन्न: 56, सत्तावन्न: 57, अठ्ठावन्न: 58,
  एकोणसाठ: 59, साठ: 60, एकसष्ट: 61, बासष्ट: 62, त्रेसष्ट: 63, चौसष्ट: 64, पासष्ट: 65, सहासष्ट: 66, सदुसष्ट: 67,
  अडुसष्ट: 68, एकोणसत्तर: 69, सत्तर: 70, एकाहत्तर: 71, बाहत्तर: 72, त्र्याहत्तर: 73, चौऱ्याहत्तर: 74, पंचाहत्तर: 75,
  शहात्तर: 76, सत्याहत्तर: 77, अठ्ठ्याहत्तर: 78, एकोणऐंशी: 79, ऐंशी: 80, एक्याऐंशी: 81, ब्याऐंशी: 82,
  त्र्याऐंशी: 83, चौऱ्याऐंशी: 84, पंच्याऐंशी: 85, शहाऐंशी: 86, सत्त्याऐंशी: 87, अठ्ठ्याऐंशी: 88, एकोणनव्वद: 89,
  नव्वद: 90, एक्याण्णव: 91, ब्याण्णव: 92, त्र्याण्णव: 93, चौऱ्याण्णव: 94, पंच्याण्णव: 95, शहाण्णव: 96,
  सत्त्याण्णव: 97, अठ्ठ्याण्णव: 98, नव्व्याण्णव: 99, शंभर: 100,
};

/** Standalone fractions: "अडीच किलो" = 2.5 kg, "पाव किलो" = 0.25 kg. */
export const FRACTIONS: Record<string, number> = {
  अर्धा: 0.5, अर्धी: 0.5, अर्धे: 0.5, पाव: 0.25, पाऊण: 0.75, पाउण: 0.75, दीड: 1.5, दिड: 1.5, अडीच: 2.5,
};

/** Prefix modifiers applied to the following number: "साडे तीन" = 3.5, "सव्वा दोन" = 2.25, "पावणे दोन" = 1.75. */
export const MODIFIERS: Record<string, (n: number) => number> = {
  साडे: (n) => n + 0.5,
  साडेतीन: () => 3.5,
  सव्वा: (n) => n + 0.25,
  पावणे: (n) => n - 0.25,
  पावणेदोन: () => 1.75,
};

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

export function normalizeDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
}

/** A single token's value, or undefined if the token is not a number. */
function tokenValue(token: string): number | undefined {
  const t = normalizeDigits(token);
  if (/^\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  if (t in UNITS_TO_HUNDRED) return UNITS_TO_HUNDRED[t];
  if (t in FRACTIONS) return FRACTIONS[t];
  // "पाचशे" = 500, "दोनशे" = 200; "शे" alone = 100.
  if (t.endsWith("शे")) {
    const head = t.slice(0, -"शे".length);
    if (head === "") return 100;
    if (head in UNITS_TO_HUNDRED) return UNITS_TO_HUNDRED[head] * 100;
  }
  return undefined;
}

export function isNumberToken(token: string): boolean {
  return tokenValue(token) !== undefined || token in MODIFIERS || token === "हजार";
}

/**
 * Reads a quantity starting at tokens[i]. Handles compound forms such as
 * "दोन हजार पाचशे" (2500), "साडे तीन" (3.5) and "१०".
 */
export function readQuantity(tokens: string[], i: number): { value: number; consumed: number } | undefined {
  let pos = i;
  let modifier: ((n: number) => number) | undefined;
  const first = tokens[pos];
  if (first in MODIFIERS) {
    modifier = MODIFIERS[first];
    pos++;
  }

  let total = 0;
  let current: number | undefined;
  while (pos < tokens.length) {
    const tok = tokens[pos];
    if (tok === "हजार") {
      total += (current ?? 1) * 1000;
      current = undefined;
      pos++;
      continue;
    }
    const v = tokenValue(tok);
    if (v === undefined) break;
    // "पाचशे पन्नास" → 550: add when the running value is a round hundred, otherwise stop.
    if (current !== undefined && !(current % 100 === 0 && v < 100)) break;
    current = (current ?? 0) + v;
    pos++;
  }

  if (current === undefined && total === 0) {
    // Fused modifiers like "साडेतीन" carry their own value.
    if (modifier && pos === i + 1 && (first === "साडेतीन" || first === "पावणेदोन")) {
      return { value: modifier(0), consumed: 1 };
    }
    return undefined;
  }
  let value = total + (current ?? 0);
  if (modifier) value = modifier(value);
  return { value, consumed: pos - i };
}
