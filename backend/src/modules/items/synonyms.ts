/**
 * Marathi words a salesperson says for English words used in the Item Master. Brand names and
 * loanwords ("क्रीम", "शॅम्पू", "पावडर") are matched by sound and need no entry here; these are
 * the words that sound nothing like their English name ("साबण" = SOAP, "तेल" = OIL).
 */
export const MARATHI_TO_ENGLISH: Record<string, string[]> = {
  साबण: ["SOAP", "SOB"], साबणाची: ["SOAP"], साबु: ["SOAP"],
  तेल: ["OIL", "TEL"], खोबरेल: ["COCONUT"], नारळ: ["COCONUT"], नारळाचे: ["COCONUT"],
  हळद: ["TURMERIC", "HALDI"], बदाम: ["ALMOND", "BADAM"], गुलाब: ["ROSE", "GULAB"], गुलाबजल: ["ROSE", "WATER"],
  दूध: ["MILK"], दुधाची: ["MILK"], लोणी: ["BUTTER"], मध: ["HONEY"], कापूर: ["CAMPHOR", "KAPUR"],
  मेणबत्ती: ["CANDLES", "CANDLE"], मेणबत्त्या: ["CANDLES"], कात्री: ["SCISSORS"], फुगे: ["BALLOONS"], फुगा: ["BALLOONS"],
  चहा: ["TEA"], कडुलिंब: ["NEEM"], लिंब: ["NEEM"], लिंबू: ["LEMON", "LIME"], चंदन: ["SANDAL", "CHANDAN"],
  मोगरा: ["JASMINE", "MOGRA"], आंबा: ["MANGO"], संत्रा: ["ORANGE"], संत्री: ["ORANGE"], केस: ["HAIR", "KESH"],
  केसांचे: ["HAIR"], दात: ["TEETH", "DANT"], दातांची: ["TOOTH", "DANT"], भांडी: ["BARTAN", "DISH"], कपडे: ["CLOTHES", "DETERGENT"],
  पांढरा: ["WHITE"], पांढरी: ["WHITE"], लाल: ["RED", "LAL"], काळा: ["BLACK"], काळी: ["BLACK"], हिरवा: ["GREEN"],
  हिरवी: ["GREEN"], पिवळा: ["YELLOW"], निळा: ["BLUE"], गुलाबी: ["PINK"], सोनेरी: ["GOLD", "GOLDEN"], सोने: ["GOLD"],
  बाळ: ["BABY"], बाळाचे: ["BABY"], बाळाची: ["BABY"], लहान: ["SMALL", "MINI"], छोटा: ["SMALL", "MINI"], छोटी: ["SMALL", "MINI"],
  मोठा: ["BIG", "JUMBO", "LARGE"], मोठी: ["BIG", "JUMBO", "LARGE"], मोठे: ["BIG", "JUMBO", "LARGE"],
  गोळ्या: ["GOLI", "CANDY"], गोळी: ["GOLI", "CANDY"], काडेपेटी: ["MATCHBOX", "MATCH"], बॅटरी: ["CELL", "BATTERY"],
  सेल: ["CELL"], मीठ: ["SALT"], साखर: ["SUGAR"], खडीसाखर: ["KHADISAKHAR"], बिस्किट: ["BISCUITS", "BISCUIT"],
  बिस्कीट: ["BISCUITS", "BISCUIT"], पुडा: ["PACK"], पाकीट: ["POUCH", "PACK"], टूथपेस्ट: ["PASTE", "TOOTHPASTE"],
  दाढी: ["SHAVING", "SHAVE"], दाढीचा: ["SHAVING"], केसांचा: ["HAIR"], चेहरा: ["FACE"], चेहऱ्याचा: ["FACE"],
  अंग: ["BODY"], अंगाचा: ["BODY"], हात: ["HAND"], हाताचा: ["HAND"], ओठ: ["LIP"], ओठांचा: ["LIP"], नख: ["NAIL"],
  डोळे: ["EYE"], काजळ: ["KAJAL", "KAJOL"], कुंकू: ["KUMKUM", "KUNKU"], मेहंदी: ["MEHANDI", "MEHENDI"],
  अगरबत्ती: ["AGARBATTI"], धूप: ["DHOOP", "DHUP"], सुपारी: ["SUPARI"], वेलची: ["ELAICHI", "CARDAMOM"],
  लवंग: ["CLOVE", "LAVANG"], जिरे: ["JEERA", "CUMIN"], मिरी: ["PEPPER"], आले: ["GINGER", "ADRAK"], लसूण: ["GARLIC"],
  कांदा: ["ONION"], बटाटा: ["BATATA", "POTATO"], शेंगदाणा: ["PEANUT", "GROUNDNUT"], शेंगदाणे: ["PEANUT", "GROUNDNUT"],
  काजू: ["KAJU", "CASHEW"], पिस्ता: ["PISTA"], खजूर: ["DATES", "KHAJUR"], तीळ: ["TIL", "SESAME"], गूळ: ["JAGGERY", "GUL"],
  डास: ["MOSQUITO", "COIL"], झुरळ: ["COCKROACH"], उंदीर: ["RAT"], सुगंधी: ["PERFUME"], अत्तर: ["ATTAR", "PERFUME"],
  पावडर: ["POWDER"], साफ: ["CLEAN", "CLEANER"], स्वच्छ: ["CLEAN"], संडास: ["TOILET"], फरशी: ["FLOOR"],
  पाणी: ["WATER"], थंड: ["COOL"], गरम: ["HOT"], गोड: ["SWEET"], तिखट: ["SPICY", "HOT"], खारट: ["SALTY"],
  उपवास: ["UPAWAS", "UPVAS"], नंबर: ["NO", "NUMBER"], नं: ["NO"], नवीन: ["NEW"], मोफत: ["FREE"], फुकट: ["FREE"], भेट: ["GIFT"],
};

/** English number words as spoken in Marathi ("गोदरेज नंबर वन" = GODREJ NO 1). */
export const ENGLISH_NUMBERS: Record<string, number> = {
  वन: 1, टू: 2, थ्री: 3, फोर: 4, फाइव्ह: 5, फाईव्ह: 5, सिक्स: 6, सेव्हन: 7, एट: 8, नाइन: 9, नाईन: 9, टेन: 10,
};

/** Case endings dropped before looking a word up: "बाळाचा" → बाळ, "केसांचे" → केस, "तेलाची" → तेल. */
const SUFFIXES = ["ांच्या", "ाच्या", "ांचा", "ांची", "ांचे", "ाचा", "ाची", "ाचे", "ाचं", "च्या", "चा", "ची", "चे", "चं", "ला", "ने"];

export function marathiSynonyms(word: string): string[] | undefined {
  if (MARATHI_TO_ENGLISH[word]) return MARATHI_TO_ENGLISH[word];
  for (const suffix of SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      const hit = MARATHI_TO_ENGLISH[word.slice(0, -suffix.length)];
      if (hit) return hit;
    }
  }
  return undefined;
}
