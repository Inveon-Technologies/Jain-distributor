/**
 * Sound-alike keys shared by Marathi (Devanagari) speech and the English item master.
 *
 * Salespeople speak Marathi, so the recogniser writes brand names the way they sound:
 * "पार्ले जी", "निव्हिया", "कोलगेट", "हिमालया". The item master is in English: "PARLE G RS 10",
 * "NIVEA SOFT CREAM", "COLGATE PASTE RS 20". Both sides are reduced to the same rough Latin
 * spelling, then to a consonant skeleton, so "कोलगेट" and "COLGATE" both become "klgt".
 */

const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "chh", ज: "j", झ: "z", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "f", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ऱ: "r", ल: "l", ळ: "l", व: "v",
  श: "sh", ष: "sh", स: "s", ह: "h",
  // Nukta forms
  क़: "k", ख़: "kh", ग़: "g", ज़: "z", ड़: "r", ढ़: "rh", फ़: "f", य़: "y",
};

const VOWELS: Record<string, string> = {
  अ: "a", आ: "a", इ: "i", ई: "i", उ: "u", ऊ: "u", ऋ: "ru", ए: "e", ऐ: "ai", ओ: "o", औ: "au",
  ऍ: "a", ऑ: "o", ॲ: "a",
};

const MATRAS: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ru", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
  // Chandra signs write English sounds: "पॅराशूट" = PARACHUTE, "कॉलगेट" = COLGATE.
  "ॅ": "a", "ॉ": "o", "ॆ": "e", "ॊ": "o",
};

const VIRAMA = "्";
const NUKTA = "़";
const LABIALS = new Set(["p", "f", "b", "m"]);

/** Rough Latin spelling of a Devanagari word, enough to compare with English names. */
export function devanagariToLatin(word: string): string {
  const chars = [...word.normalize("NFC")];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i];
    if (chars[i + 1] === NUKTA) {
      ch += NUKTA;
      i++;
    }
    const consonant = CONSONANTS[ch];
    if (consonant !== undefined) {
      out += consonant;
      const next = chars[i + 1];
      // Inherent "a" unless a vowel sign or virama follows; Marathi drops it at the end of a word.
      if (next === undefined) continue;
      if (next === VIRAMA) {
        i++;
        continue;
      }
      if (MATRAS[next] !== undefined || next === NUKTA) continue;
      if (next === "ं" || next === "ँ" || next === "ः" || CONSONANTS[next] !== undefined) out += "a";
      continue;
    }
    if (MATRAS[ch] !== undefined) {
      out += MATRAS[ch];
      continue;
    }
    if (VOWELS[ch] !== undefined) {
      out += VOWELS[ch];
      continue;
    }
    if (ch === "ं" || ch === "ँ") {
      // Anusvara: "m" before p/b/m ("चंपा" → champa), "n" otherwise ("संतूर" → santur).
      const following = CONSONANTS[chars[i + 1] ?? ""] ?? "";
      out += LABIALS.has(following[0]) ? "m" : "n";
      continue;
    }
    if (ch === "ः") {
      out += "h";
      continue;
    }
    if (/[0-9a-z]/i.test(ch)) out += ch.toLowerCase();
    else if (/[०-९]/.test(ch)) out += String("०१२३४५६७८९".indexOf(ch));
  }
  return out;
}

/** English letters as they are spoken in Marathi: "पी पी" → P P, "एमडीएच" → MDH. */
const LETTER_NAMES: Record<string, string> = {
  ए: "a", बी: "b", सी: "c", डी: "d", ई: "e", एफ: "f", जी: "g", एच: "h", आय: "i", जे: "j", के: "k",
  एल: "l", एम: "m", एन: "n", ओ: "o", पी: "p", क्यू: "q", आर: "r", एस: "s", टी: "t", यू: "u",
  व्ही: "v", डब्ल्यू: "w", एक्स: "x", वाय: "y", झेड: "z", झेड्: "z",
};
const LETTER_NAMES_BY_LENGTH = Object.keys(LETTER_NAMES).sort((a, b) => b.length - a.length);

/** "एमडीएच" → "mdh" when the word is made only of letter names, otherwise undefined. */
export function spelledLetters(word: string): string | undefined {
  if (LETTER_NAMES[word]) return LETTER_NAMES[word];
  let rest = word;
  let out = "";
  while (rest) {
    const name = LETTER_NAMES_BY_LENGTH.find((n) => n.length > 1 && rest.startsWith(n));
    if (!name) return undefined;
    out += LETTER_NAMES[name];
    rest = rest.slice(name.length);
  }
  return out.length > 1 ? out : undefined;
}

const DEVANAGARI = /[ऀ-ॿ]/;

export const isDevanagari = (text: string) => DEVANAGARI.test(text);

/**
 * Common spelling-to-sound rules applied to the rough Latin form of either language. English
 * spellings get a few extra rules first (silent final "e", "tion", soft "c").
 */
function soundOut(latin: string, english: boolean): string {
  let s = latin.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return s;
  if (english) {
    s = s
      .replace(/(.)\1+/g, "$1")
      .replace(/tion/g, "shan")
      .replace(/alm/g, "am")
      .replace(/ck/g, "k")
      .replace(/ch/g, "C")
      .replace(/c(?=[eiy])/g, "s")
      .replace(/c/g, "k")
      .replace(/C/g, "ch")
      .replace(/q/g, "k")
      .replace(/x/g, "ks")
      .replace(/w/g, "v")
      .replace(/([^aeiou])e$/, "$1")
      .replace(/^y/, "i");
  }
  s = s
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    // g/j and z/j are confused both ways ("GEL" = "जेल", "ZANDU" = "झंडू", "MAGGI" = "मॅगी").
    .replace(/[gz]/g, "j")
    // Aspiration is often lost or added in speech: "dh" ≈ "d", "bh" ≈ "b". Keep a leading "h".
    .replace(/(?!^)h/g, "")
    .replace(/y/g, "i")
    // Three vowel classes: a, i (i/e/ai/ay), u (u/o/au/ow).
    .replace(/ai|ay|ae|ea|ee|ie|ei|e/g, "i")
    .replace(/au|aw|ou|oo|ow|o/g, "u");
  return s.replace(/(.)\1+/g, "$1");
}

export interface WordKey {
  /** Sound-alike spelling with vowels ("kolget"). */
  full: string;
  /** Consonants only ("klgt"); vowels are where spellings disagree most. */
  skeleton: string;
}

export function keyOfLatin(latin: string, english = true): WordKey {
  const full = soundOut(latin, english);
  // Keep a marker for a leading vowel so "ARIEL" (arl) does not compare equal to "RL".
  const skeleton = full.replace(/^[aiu]/, "a").replace(/(?!^)[aiu]/g, "").replace(/(.)\1+/g, "$1");
  return { full, skeleton };
}

/** Key of a spoken or written word in either script. */
export function keyOf(word: string): WordKey {
  if (isDevanagari(word)) {
    const letters = spelledLetters(word);
    if (letters) return keyOfLatin(letters);
    return keyOfLatin(devanagariToLatin(word), false);
  }
  return keyOfLatin(word);
}

/** Levenshtein distance; inputs are short words, so the simple O(n·m) table is fine. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const ratio = (a: string, b: string) => 1 - editDistance(a, b) / Math.max(a.length, b.length, 1);

/**
 * How alike two words sound, 0–1. Short words need an exact skeleton plus close vowels, so "रिन"
 * finds "RIN" without "RIN" also matching every "R?N" word.
 */
export function similarity(a: WordKey, b: WordKey): number {
  if (!a.full || !b.full) return 0;
  if (a.full === b.full) return 1;
  const skel = ratio(a.skeleton, b.skeleton);
  const full = ratio(a.full, b.full);
  const shortest = Math.min(a.skeleton.length, b.skeleton.length);
  if (shortest <= 2) {
    if (a.skeleton !== b.skeleton) return Math.min(skel, full) * 0.6;
    return a.skeleton.length === 2 ? Math.max(0.75, full) : Math.max(0.6, full);
  }
  // One extra consonant at the end ("BISCUITS" / "बिस्किट", "CANDLES" / "CANDAL") is nearly equal.
  const [short, long] = a.skeleton.length <= b.skeleton.length ? [a.skeleton, b.skeleton] : [b.skeleton, a.skeleton];
  const prefix = long.length - short.length === 1 && long.startsWith(short) ? 0.8 + 0.1 * full : 0;
  return Math.max(prefix, 0.7 * skel + 0.3 * full);
}
