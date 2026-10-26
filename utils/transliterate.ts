// Comprehensive bidirectional Marathi <-> English transliteration and bilingual formatting utility

// Common dictionary for rapid and 100% accurate business / location / proper name mapping
const DICTIONARY_EN_TO_MR: Record<string, string> = {
  // Common Store & Business terms
  kirana: "किराणा",
  store: "स्टोअर",
  stores: "स्टोअर्स",
  shop: "दुकान",
  trader: "ट्रेडर",
  traders: "ट्रेडर्स",
  bhandar: "भंडार",
  provision: "प्रोव्हिजन",
  agency: "एजन्सी",
  agencies: "एजन्सीज",
  supermarket: "सुपरमार्केट",
  mart: "मार्ट",
  general: "जनरल",
  enterprise: "एंटरप्रायझेस",
  enterprises: "एंटरप्रायझेस",
  distributor: "डिस्ट्रीब्यूटर",
  distributors: "डिस्ट्रीब्युटर्स",
  center: "सेंटर",
  centre: "सेंटर",

  // Religious / Auspicious prefixes
  shri: "श्री",
  shree: "श्री",
  sai: "साई",
  mauli: "माऊली",
  samarth: "समर्थ",
  ganesh: "गणेश",
  vitthal: "विठ्ठल",
  krishna: "कृष्णा",
  laxmi: "लक्ष्मी",
  mahalaxmi: "महालक्ष्मी",
  bhavani: "भवानी",
  jai: "जय",
  om: "ओम",
  swami: "स्वामी",
  krupa: "कृपा",
  balaji: "बालाजी",
  hanuman: "हनुमान",
  shankar: "शंकर",
  shiv: "शिव",
  guru: "गुरू",

  // Common Marathi Last Names / Surnames
  patil: "पाटील",
  shinde: "शिंदे",
  jadhav: "जाधव",
  kulkarni: "कुलकर्णी",
  deshmukh: "देशमुख",
  pawar: "पवार",
  kale: "काळे",
  chavan: "चव्हाण",
  more: "मोरे",
  gaikwad: "गायकवाड",
  kadam: "कदम",
  salunkhe: "साळुंखे",
  bhosale: "भोसले",
  mane: "माने",
  sawant: "सावंत",
  thorat: "थोरात",
  jagtap: "जगतप",
  raut: "राऊत",
  joshi: "जोशी",
  wagh: "वाघ",
  inamdar: "इनामदार",

  // Common First Names
  ramesh: "रमेश",
  suresh: "सुरेश",
  mahesh: "महेश",
  dinesh: "दिनेश",
  amol: "अमोल",
  santosh: "संतोष",
  rahul: "राहुल",
  sachin: "सचिन",
  anand: "आनंद",
  vishnu: "विष्णू",
  pandurang: "पांडुरंग",
  dattatray: "दत्तात्रय",
  mahadev: "महादेव",
  ajay: "अजय",
  vijay: "विजय",
  anil: "अनिल",
  sunil: "सुनील",
  nitin: "नितीन",
  prashant: "प्रशांत",
  pravin: "प्रवीण",
  vikas: "विकास",

  // Common Locations & Villages around Pandharpur / Solapur
  sangola: "सांगोला",
  akluj: "अकलूज",
  wakhari: "वाखरी",
  mangalwedha: "मंगळवेढा",
  mangalvedha: "मंगळवेढा",
  pandharpur: "पंढरपूर",
  solapur: "सोलापूर",
  karmala: "करमाळा",
  madha: "माढा",
  barshi: "बार्शी",
  mohol: "मोहोळ",
  malshiras: "माळशिरस",
  kavathe: "कवठे",
  mahad: "महाड",
  kurduwadi: "कुर्डूवाडी",
  piliv: "पिलीव",
  natepute: "नातेपुते",

  // Common Address Words
  road: "रोड",
  chowk: "चौक",
  near: "जवळ",
  opp: "समोर",
  opposite: "समोर",
  station: "स्टेशन",
  bus: "बस",
  stand: "स्टँड",
  market: "मार्केट",
  yard: "यार्ड",
  galli: "गल्ली",
  main: "मुख्य",
  peth: "पेठ",
  nagar: "नगर",
  mandir: "मंदिर",
  temple: "मंदिर",
};

// Invert dictionary for Marathi to English
const DICTIONARY_MR_TO_EN: Record<string, string> = {};
for (const [en, mr] of Object.entries(DICTIONARY_EN_TO_MR)) {
  const capitalized = en.charAt(0).toUpperCase() + en.slice(1);
  if (!DICTIONARY_MR_TO_EN[mr]) {
    DICTIONARY_MR_TO_EN[mr] = capitalized;
  }
}

// Check if string contains Devanagari script characters
export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

// Transliterate English word to Marathi using phonetic rules
function transliterateEnglishWord(word: string): string {
  const lower = word.toLowerCase();
  if (DICTIONARY_EN_TO_MR[lower]) {
    return DICTIONARY_EN_TO_MR[lower];
  }

  // Common phonetic substitutions
  let res = lower;
  const replacements: [RegExp, string][] = [
    [/shree/g, "श्री"],
    [/shri/g, "श्री"],
    [/kh/g, "ख"],
    [/gh/g, "घ"],
    [/ch/g, "च"],
    [/chh/g, "छ"],
    [/jh/g, "झ"],
    [/th/g, "थ"],
    [/dh/g, "ध"],
    [/ph/g, "फ"],
    [/bh/g, "भ"],
    [/sh/g, "श"],
    [/k/g, "क"],
    [/g/g, "ग"],
    [/j/g, "ज"],
    [/t/g, "ट"],
    [/d/g, "ड"],
    [/n/g, "न"],
    [/p/g, "प"],
    [/f/g, "फ"],
    [/b/g, "ब"],
    [/m/g, "म"],
    [/y/g, "य"],
    [/r/g, "र"],
    [/l/g, "ल"],
    [/v/g, "व"],
    [/w/g, "व"],
    [/s/g, "स"],
    [/h/g, "ह"],
    [/aa/g, "ा"],
    [/ee/g, "ी"],
    [/oo/g, "ू"],
    [/ai/g, "ै"],
    [/au/g, "ौ"],
    [/a/g, "ा"],
    [/i/g, "ि"],
    [/u/g, "ु"],
    [/e/g, "े"],
    [/o/g, "ो"],
  ];

  for (const [pattern, dev] of replacements) {
    res = res.replace(pattern, dev);
  }

  return res;
}

// Transliterate Marathi word to English
function transliterateMarathiWord(word: string): string {
  if (DICTIONARY_MR_TO_EN[word]) {
    return DICTIONARY_MR_TO_EN[word];
  }

  // Basic character-by-character mapping
  const charMap: Record<string, string> = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
    "ष": "sh", "स": "s", "ह": "h", "ळ": "l", "क्ष": "ksh", "ज्ञ": "dny",
    "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ः": "h",
    "अ": "A", "आ": "Aa", "इ": "I", "ई": "Ee", "उ": "U", "ऊ": "Oo",
    "ए": "E", "ऐ": "Ai", "ओ": "O", "औ": "Au",
  };

  let out = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  // Capitalize first letter
  if (out.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Given any input string (whether typed in English or Marathi),
 * automatically returns a clean pair of { mr, en }.
 */
export function autoBilingualName(input: string): { mr: string; en: string } {
  const trimmed = (input || "").trim();
  if (!trimmed) return { mr: "", en: "" };

  if (isDevanagari(trimmed)) {
    // Input is in Marathi -> derive English
    const words = trimmed.split(/\s+/);
    const enWords = words.map(transliterateMarathiWord);
    return {
      mr: trimmed,
      en: enWords.join(" "),
    };
  } else {
    // Input is in English -> derive Marathi
    const words = trimmed.split(/\s+/);
    const mrWords = words.map(transliterateEnglishWord);
    return {
      mr: mrWords.join(" "),
      en: trimmed
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    };
  }
}

/**
 * Universal Bilingual Name Formatter:
 * - If current language is 'mr': Marathi (English) -> सांगोला (Sangola)
 * - If current language is 'en': English (Marathi) -> Sangola (सांगोला)
 * - If identical or missing one, falls back gracefully.
 */
export function formatBilingual(
  marathi: string | undefined,
  english: string | undefined,
  currentLanguage: "mr" | "en"
): string {
  const mr = (marathi || "").trim();
  const en = (english || "").trim();

  if (!mr && !en) return "";
  if (!en) return mr;
  if (!mr) return en;
  if (mr.toLowerCase() === en.toLowerCase()) return mr;

  if (currentLanguage === "mr") {
    return `${mr} (${en})`;
  } else {
    return `${en} (${mr})`;
  }
}
