// Comprehensive bidirectional Marathi <-> English transliteration and bilingual formatting utility

// Curated high-frequency dictionary for Maharashtra places, common business terms, and proper names
const DICTIONARY_EN_TO_MR: Record<string, string> = {
  // Common locations, districts & talukas
  kolhapur: "कोल्हापूर",
  hatkanangale: "हातकणंगले",
  pandharpur: "पंढरपूर",
  solapur: "सोलापूर",
  sangola: "सांगोला",
  akluj: "अकलूज",
  wakhari: "वाखरी",
  mangalwedha: "मंगळवेढा",
  mangalvedha: "मंगळवेढा",
  karmala: "करमाळा",
  barshi: "बार्शी",
  madha: "माढा",
  malshiras: "माळशिरस",
  sangli: "सांगली",
  satara: "सातारा",
  miraj: "मिरज",
  ichalkaranji: "इचलकरंजी",
  karad: "कराड",
  pune: "पुणे",
  mumbai: "मुंबई",
  nashik: "नाशिक",
  nagpur: "नागपूर",
  sambhajinagar: "संभाजीनगर",
  dharashiv: "धाराशिव",
  osmanabad: "उस्मानाबाद",
  aurangabad: "औरंगाबाद",
  thane: "ठाणे",
  jalgaon: "जळगाव",
  nanded: "नांदेड",
  latur: "लातूर",
  ahmednagar: "अहमदनगर",
  kalyan: "कल्याण",
  tasgaon: "तासगाव",
  jath: "जत",
  kavathe: "कवठे",
  mahabaleshwar: "महाबळेश्वर",
  wai: "वाई",
  phaltan: "फलटण",
  atpadi: "आटपाडी",
  kadegaon: "कडेगाव",
  ashta: "आष्टा",
  udgir: "उदगीर",
  tuljapur: "तुळजापूर",
  kurduwadi: "कुर्डूवाडी",
  vadgaon: "वडगाव",
  sawantwadi: "सावंतवाडी",
  delhi: "दिल्ली",

  // Modern loanwords & tech terms with open-vowel candra
  angular: "अँगुलर",
  android: "अँड्रॉइड",
  apple: "अॅपल",
  action: "अॅक्शन",
  app: "अॅप",
  apps: "अॅप्स",
  agency: "एजन्सी",
  agencies: "एजन्सीज",
  bank: "बँक",
  angle: "अँगल",
  antivirus: "अँटीव्हायरस",
  antigravity: "अँटीग्रॅव्हिटी",
  admin: "अॅडमिन",
  computer: "संगणक",
  mobile: "मोबाईल",
  laptop: "लॅपटॉप",
  software: "सॉफ्टवेअर",
  hardware: "हार्डवेअर",

  // Common Names & Surnames
  varsha: "वर्षा",
  kedar: "केदार",
  ankita: "अंकिता",
  utture: "उत्तुरे",
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
  jagtap: "जगताप",
  raut: "राऊत",
  joshi: "जोशी",
  wagh: "वाघ",
  inamdar: "इनामदार",
  jain: "जैन",
  shah: "शहा",
  mehta: "मेहता",
  gandhi: "गांधी",
  agarwal: "अगरवाल",
  amol: "अमोल",
  santosh: "संतोष",
  rahul: "राहुल",
  sachin: "सचिन",
  ramesh: "रमेश",
  suresh: "सुरेश",
  mahesh: "महेश",
  dinesh: "दिनेश",
  anand: "आनंद",
  amit: "अमित",
  amar: "अमर",
  anil: "अनिल",
  arun: "अरुण",
  ashok: "अशोक",
  avinash: "अविनाश",
  rajesh: "राजेश",
  sunita: "सुनिता",
  rohit: "रोहित",
  priya: "प्रिया",
  pooja: "पूजा",
  puja: "पूजा",
  deepak: "दीपक",
  dipak: "दीपक",
  swapnil: "स्वप्निल",
  shubham: "शुभम",
  akshay: "अक्षय",
  bharat: "भारत",
  sanjay: "संजय",
  vishnu: "विष्णू",
  pandurang: "पांडुरंग",
  dattatray: "दत्तात्रय",
  mahadev: "महादेव",
  ajay: "अजय",
  vijay: "विजय",
  nitin: "नितीन",
  prashant: "प्रशांत",
  pravin: "प्रवीण",
  praveen: "प्रवीण",
  vikas: "विकास",
  prasad: "प्रसाद",
  prakash: "प्रकाश",
  sagar: "सागर",
  subhash: "सुभाष",
  harsh: "हर्ष",
  harshal: "हर्षल",
  adarsh: "आदर्श",
  darshan: "दर्शन",
  utkarsh: "उत्कर्ष",
  sparsh: "स्पर्श",
  mandar: "मंदार",
  kailash: "कैलाश",
  kailas: "कैलास",
  vilas: "विलास",
  vishwas: "विश्वास",
  sandip: "संदिप",
  sandeep: "संदीप",
  sunil: "सुनील",
  sudhir: "सुधीर",
  sambhaji: "संभाजी",
  shivaji: "शिवाजी",
  tanaji: "तानाजी",
  shahaji: "शहाजी",
  tukaram: "तुकाराम",
  dnyaneshwar: "ज्ञानेश्वर",
  namdev: "नामदेव",
  eknath: "एकनाथ",
  ramdas: "रामदास",
  gorakh: "गोरख",
  babasaheb: "बाबासाहेब",
  bhagwan: "भगवान",
  balasaheb: "बाळासाहेब",
  ashwini: "अश्विनी",
  anita: "अनिता",
  poonam: "पूनम",
  sneha: "स्नेहा",
  snehal: "स्नेहल",
  komal: "कोमल",
  swati: "स्वाती",
  rupali: "रूपाली",
  manisha: "मनीषा",
  pallavi: "पल्लवी",
  pranita: "प्रणिता",
  pranjal: "प्रांजल",
  shweta: "श्वेता",
  priyanka: "प्रियंका",
  renuka: "रेणुका",
  surekha: "सुरेखा",
  rekha: "रेखा",
  archana: "अर्चना",
  arati: "आरती",
  aarti: "आरती",
  sheetal: "शीतल",
  shital: "शीतल",
  jyoti: "ज्योती",
  deepali: "दीपाली",
  dipali: "दीपाली",
  monika: "मोनिका",
  sonali: "सोनाली",
  tejaswini: "तेजस्विनी",
  vidya: "विद्या",
  vaishali: "वैशाली",
  kavita: "कविता",
  savita: "सविता",
  sarika: "सारिका",
  madhuri: "माधुरी",
  meena: "मीना",
  mina: "मीना",
  anuradha: "अनुराधा",
  pratibha: "प्रतिभा",
  sharda: "शारदा",
  sarita: "सरिता",
  chhaya: "छाया",
  ujwala: "उज्वला",
  shobha: "शोभा",
  alaka: "अलका",
  alka: "अलका",
  mangala: "मंगला",
  sujata: "सुजाता",
  nirmala: "निर्मला",
  radha: "राधा",
  geeta: "गीता",
  gita: "गीता",
  sushma: "सुषमा",
  seema: "सीमा",
  sima: "सीमा",
  vrushali: "वृषाली",
  rutuja: "ऋतुजा",
  sakshi: "साक्षी",
  tanvi: "तन्वी",
  akshata: "अक्षता",
  sayali: "सायली",
  diksha: "दीक्षा",
  deeksha: "दीक्षा",
  divya: "दिव्या",
  shraddha: "श्रद्धा",
  prachi: "प्राची",
  neha: "नेहा",
  tanuja: "तनुजा",
  gauri: "गौरी",
  kasturi: "कस्तुरी",
  bhagyashree: "भाग्यश्री",
  jayashree: "जयश्री",
  dhanashree: "धनश्री",
  rajashree: "राजश्री",
  suvarna: "सुवर्णा",
  kalyani: "कल्याणी",
  ketaki: "केतकी",
  mayuri: "मयुरी",
  payal: "पायल",
  kajal: "काजल",
  ananya: "अनन्या",
  aditi: "अदिती",
  ishani: "ईशानी",
  anushka: "अनुष्का",
  riya: "रिया",
  diya: "दिया",
  siya: "सिया",
  samruddhi: "समृद्धी",
  sanvi: "सान्वी",
  saanvi: "सान्वी",
  anvi: "अन्वी",
  avani: "अवनी",
  avni: "अवनी",
  ira: "इरा",
  aarya: "आर्या",
  arya: "आर्या",
  vedika: "वेदिका",
  anika: "अनिका",
  vaidehi: "वैदेही",
  shreya: "श्रेया",
  varun: "वरुण",
  tarun: "तरुण",
  chetan: "चेतन",
  kunal: "कुणाल",
  karan: "करण",
  rohan: "रोहन",
  soham: "सोहम",
  omkar: "ओंकार",
  atharva: "अथर्व",
  vedant: "वेदांत",
  samarth: "समर्थ",
  yash: "यश",
  ayush: "आयुष",
  shreyas: "श्रेयस",
  aditya: "आदित्य",
  aryan: "आर्यन",
  arnav: "अर्णव",
  dhruv: "ध्रुव",
  tanmay: "तन्मय",
  chinmay: "चिन्मय",
  tejas: "तेजस",
  aniket: "अनिकेत",
  nikhil: "निखिल",
  sourabh: "सौरभ",
  saurabh: "सौरभ",
  tushar: "तुषार",
  mayur: "मयूर",
  abhishek: "अभिषेक",
  pratik: "प्रतीक",
  sanket: "संकेत",
  virat: "विराट",
  ajinkya: "अजिंक्य",
  suraj: "सूरज",
  pankaj: "पंकज",
  neeraj: "नीरज",
  niraj: "नीरज",
  bhushan: "भूषण",
  vinayak: "विनायक",
  parag: "पराग",
  shantanu: "शांतनु",
  anurag: "अनुराग",
  vivek: "विवेक",
  vikram: "विक्रम",
  vishal: "विशाल",
  gaurav: "गौरव",
  mohit: "मोहित",
  sumit: "सुमित",
  ajit: "अजित",
  sujit: "सुजित",
  ranjit: "रणजित",
  samir: "समीर",
  sameer: "समीर",
  pramod: "प्रमोद",
  vinod: "विनोद",
  manoj: "मनोज",
  naresh: "नरेश",
  kamlesh: "कमलेश",
  umesh: "उमेश",
  mukesh: "मुकेश",
  yogesh: "योगेश",
  mangesh: "मंगेश",
  satish: "सतीश",
  ashish: "आशिष",
  harish: "हरीश",
  girish: "गिरीश",
  jagdish: "जगदीश",
  kuldeep: "कुलदीप",
  dilip: "दिलीप",
  pradeep: "प्रदीप",
  anup: "अनुप",
  anoop: "अनुप",
  swarup: "स्वरूप",
  siddharth: "सिद्धार्थ",
  siddhesh: "सिद्धेश",
  dhananjay: "धनंजय",
  abhay: "अभय",
  vinay: "विनय",
  uday: "उदय",
  akash: "आकाश",
  pranav: "प्रणव",
  prathamesh: "प्रथमेश",
  shashikant: "शशिकांत",
  chandrakant: "चंद्रकांत",
  suryakant: "सूर्यकांत",
  ravindra: "रवींद्र",
  ramchandra: "रामचंद्र",
  narayan: "नारायण",
  maruti: "मारुती",
  hanmant: "हनमंत",
  laxman: "लक्ष्मण",
  shrikant: "श्रीकांत",
  keshav: "केशव",
  govind: "गोविंद",
  gopal: "गोपाल",
  damodar: "दामोदर",
  shridhar: "श्रीधर",
  gajanan: "गजानन",

  // Store & Business terms
  kirana: "किराणा",
  store: "स्टोअर",
  stores: "स्टोअर्स",
  shop: "दुकान",
  trader: "ट्रेडर",
  traders: "ट्रेडर्स",
  bhandar: "भंडार",
  provision: "प्रोव्हिजन",
  supermarket: "सुपरमार्केट",
  mart: "मार्ट",
  general: "जनरल",
  enterprise: "एंटरप्रायझेस",
  enterprises: "एंटरप्रायझेस",
  distributor: "डिस्ट्रिब्युटर",
  distributors: "डिस्ट्रिब्युटर्स",
  center: "सेंटर",
  centre: "सेंटर",
  shri: "श्री",
  shree: "श्री",
  sai: "साई",
  mauli: "माऊली",
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
};

// Inverted dictionary for Marathi -> English
const DICTIONARY_MR_TO_EN: Record<string, string> = Object.entries(DICTIONARY_EN_TO_MR).reduce(
  (acc, [en, mr]) => {
    acc[mr] = en.charAt(0).toUpperCase() + en.slice(1);
    return acc;
  },
  {} as Record<string, string>
);

// Check if string contains Devanagari characters
export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

// Universal English word -> Marathi Devanagari transliteration
export function transliterateEnglishWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w) return "";
  if (DICTIONARY_EN_TO_MR[w]) return DICTIONARY_EN_TO_MR[w];

  // 1. Compound Place / Word endings
  if (w.length > 4 && (w.endsWith("gaon") || w.endsWith("goan") || w.endsWith("ganw"))) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "गाव";
  }
  if (w.length > 4 && (w.endsWith("wadi") || w.endsWith("vadi"))) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "वाडी";
  }
  if (w.length > 3 && w.endsWith("pur")) {
    const base = w.slice(0, -3);
    return transliterateEnglishWord(base) + "पूर";
  }
  if (w.length > 5 && w.endsWith("nagar")) {
    const base = w.slice(0, -5);
    return transliterateEnglishWord(base) + "नगर";
  }
  if (w.length > 5 && w.endsWith("shwar")) {
    const base = w.slice(0, -5);
    return transliterateEnglishWord(base) + "श्वर";
  }

  // 2. Common Indian Name Suffix Patterns where single 'a' represents long 'ा'
  if (w.length > 3 && w.endsWith("dar") && !w.endsWith("ndar") && !w.endsWith("ddar")) {
    const base = w.slice(0, -3);
    return transliterateEnglishWord(base) + "दार";
  }
  if (w.length > 4 && w.endsWith("kash")) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "काश";
  }
  if (w.length > 4 && w.endsWith("nash")) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "नाश";
  }
  if (w.length > 5 && w.endsWith("bhash")) {
    const base = w.slice(0, -5);
    return transliterateEnglishWord(base) + "भाष";
  }
  if (w.length > 4 && w.endsWith("lash")) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "लाश";
  }
  if (w.length > 4 && w.endsWith("nath")) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "नाथ";
  }
  if (w.length > 4 && w.endsWith("kant")) {
    const base = w.slice(0, -4);
    return transliterateEnglishWord(base) + "कांत";
  }
  if (w.length > 3 && w.endsWith("rao")) {
    const base = w.slice(0, -3);
    return transliterateEnglishWord(base) + "राव";
  }

  // 3. Modern loanwords & English terms starting with open-vowel candra
  if (w.startsWith("angu")) {
    return "अँगुलर" + transliterateEnglishWord(w.slice(7));
  }
  if (w.startsWith("androi")) {
    return "अँड्रॉइड" + transliterateEnglishWord(w.slice(7));
  }
  if (w.startsWith("appl")) {
    return "अॅपल" + transliterateEnglishWord(w.slice(5));
  }
  if (w.startsWith("angl")) {
    return "अँगल" + transliterateEnglishWord(w.slice(5));
  }
  if (w.startsWith("ang")) {
    if (["e", "i", "u"].includes(w[3])) {
      return "अँग" + transliterateEnglishWord(w.slice(3));
    }
  }

  // Generalized Phonetic Consonants & Conjuncts
  const consonants: [string, string][] = [
    ["ksh", "क्ष"], ["dny", "ज्ञ"], ["jny", "ज्ञ"], ["gy", "ज्ञ"],
    ["shh", "ष"], ["chh", "छ"],
    ["rsh", "र्ष"], ["shn", "ष्ण"],
    ["kh", "ख"], ["gh", "घ"], ["ch", "च"], ["jh", "झ"],
    ["th", "थ"], ["dh", "ध"], ["ph", "फ"], ["bh", "भ"], ["sh", "श"],
    ["lh", "ल्ह"], ["tt", "त्त"], ["dd", "ड्ड"], ["kk", "क्क"], ["pp", "प्प"],
    ["mm", "म्म"], ["nn", "न्न"], ["ll", "ल्ल"], ["ss", "स्स"], ["bb", "ब्ब"],
    ["pr", "प्र"], ["kr", "क्र"], ["tr", "त्र"], ["gr", "ग्र"], ["dr", "द्र"],
    ["br", "ब्र"], ["vr", "व्र"], ["mr", "म्र"], ["sr", "स्र"],
    ["st", "स्त"], ["sp", "स्प"], ["sk", "स्क"], ["sm", "स्म"], ["sw", "स्व"], ["sv", "स्व"],
    ["k", "क"], ["g", "ग"], ["c", "क"], ["j", "ज"], ["t", "त"],
    ["d", "द"], ["n", "न"], ["p", "प"], ["f", "फ"], ["b", "ब"],
    ["m", "म"], ["y", "य"], ["r", "र"], ["l", "ल"], ["v", "व"],
    ["w", "व"], ["s", "स"], ["h", "ह"], ["z", "झ"], ["x", "क्स"]
  ];

  const vowels = "aeiou";
  let i = 0;
  let res = "";
  const n = w.length;

  while (i < n) {
    // Word-initial independent vowels
    if (i === 0) {
      if (w.startsWith("aa")) { res += "आ"; i += 2; continue; }
      if (w.startsWith("ai")) { res += "ऐ"; i += 2; continue; }
      if (w.startsWith("au")) { res += "औ"; i += 2; continue; }
      if (w.startsWith("ee") || w.startsWith("ii")) { res += "ई"; i += 2; continue; }
      if (w.startsWith("oo") || w.startsWith("uu")) { res += "ऊ"; i += 2; continue; }
      if (w.startsWith("e")) { res += "ए"; i += 1; continue; }
      if (w.startsWith("o")) { res += "ओ"; i += 1; continue; }
      if (w.startsWith("i")) { res += "इ"; i += 1; continue; }
      if (w.startsWith("u")) { res += "उ"; i += 1; continue; }
      if (w.startsWith("a")) {
        // Nasal (anuswar) only if followed by n/m + consonant (e.g. ankita, ambedkar)
        if (w.length > 2 && (w[1] === "n" || w[1] === "m") && !vowels.includes(w[2])) {
          res += "अं";
          i += 2;
          continue;
        }
        res += "अ";
        i += 1;
        continue;
      }
    }

    // Consonant matching
    let matchedC = false;
    for (const [ck, dev] of consonants) {
      if (w.startsWith(ck, i)) {
        i += ck.length;
        matchedC = true;

        // Check following vowel/matra
        const matras: [string, string][] = [
          ["aa", "ा"], ["ee", "ी"], ["ii", "ी"], ["oo", "ू"], ["uu", "ू"],
          ["ai", "ै"], ["au", "ौ"], ["e", "े"], ["o", "ो"],
          ["i", "ि"], ["u", "ु"], ["a", "ा"]
        ];

        let matchedM = false;
        for (const [mk, mdev] of matras) {
          if (w.startsWith(mk, i)) {
            let actualMatra = mdev;
            if (mk === "a") {
              if (i + 1 === n) {
                actualMatra = "ा"; // At word end: 'a' is open vowel 'ा'
              } else {
                actualMatra = ""; // Middle schwa has no matra
              }
            }
            i += mk.length;

            // Anuswar ONLY before another consonant (e.g. sanjay, pandharpur, kante)
            let hasAnuswar = false;
            if (i < n - 1 && (w[i] === "n" || w[i] === "m") && !vowels.includes(w[i + 1])) {
              hasAnuswar = true;
              i++;
            }

            res += dev + actualMatra + (hasAnuswar ? "ं" : "");
            matchedM = true;
            break;
          }
        }

        if (!matchedM) {
          // If followed by another consonant -> conjunct halant
          if (i < n && consonants.some(([k]) => w.startsWith(k, i))) {
            res += dev + "्";
          } else {
            res += dev;
          }
        }
        break;
      }
    }

    if (!matchedC) {
      res += w[i];
      i++;
    }
  }

  return res;
}

// Transliterate full English phrase to Marathi
export function transliterateEnglishToMarathi(text: string): string {
  const words = text.trim().split(/\s+/);
  return words.map(transliterateEnglishWord).join(" ");
}

// Transliterate Marathi text to clean English
export function transliterateMarathiWord(word: string): string {
  if (DICTIONARY_MR_TO_EN[word]) {
    return DICTIONARY_MR_TO_EN[word];
  }

  const charMap: Record<string, string> = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
    "ष": "sh", "स": "s", "ह": "h", "ळ": "l", "क्ष": "ksh", "ज्ञ": "dny",
    "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ः": "h", "ँ": "n", "ॅ": "a",
    "अ": "A", "आ": "Aa", "इ": "I", "ई": "Ee", "उ": "U", "ऊ": "Oo",
    "ए": "E", "ऐ": "Ai", "ओ": "O", "औ": "Au", "अँ": "An", "अॅ": "A", "अं": "An",
    "्": ""
  };

  let out = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  if (out.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

// Transliterate full Marathi phrase to English
export function transliterateMarathiToEnglish(text: string): string {
  const words = text.trim().split(/\s+/);
  return words.map(transliterateMarathiWord).join(" ");
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
    const enText = transliterateMarathiToEnglish(trimmed);
    return {
      mr: trimmed,
      en: enText,
    };
  } else {
    // Input is in English -> derive Marathi
    const mrText = transliterateEnglishToMarathi(trimmed);
    const enText = trimmed
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      mr: mrText,
      en: enText,
    };
  }
}

/**
 * Extracts primary and secondary parts for bilingual display:
 * - If current language is 'mr': primary is Marathi, secondary is English
 * - If current language is 'en': primary is English, secondary is Marathi
 */
export function getBilingualParts(
  marathi: string | undefined,
  english: string | undefined,
  currentLanguage: "mr" | "en"
): { primary: string; secondary?: string } {
  const mr = (marathi || "").trim();
  const en = (english || "").trim();

  if (!mr && !en) return { primary: "" };
  if (!en) return { primary: mr };
  if (!mr) return { primary: en };
  if (mr.toLowerCase() === en.toLowerCase()) return { primary: mr };

  if (currentLanguage === "mr") {
    return { primary: mr, secondary: en };
  } else {
    return { primary: en, secondary: mr };
  }
}

/**
 * Universal Bilingual Name Formatter (plain text string):
 * - If current language is 'mr': Marathi (English) -> सांगोला (Sangola)
 * - If current language is 'en': English (Marathi) -> Sangola (सांगोला)
 * - If identical or missing one, falls back gracefully.
 * Used for <option>, <title>, window alerts, and non-JSX contexts.
 */
export function formatBilingual(
  marathi: string | undefined,
  english: string | undefined,
  currentLanguage: "mr" | "en"
): string {
  const { primary, secondary } = getBilingualParts(marathi, english, currentLanguage);
  return secondary ? `${primary} (${secondary})` : primary;
}
