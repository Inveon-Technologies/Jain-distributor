import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger.js";
import { hashPassword } from "../modules/auth/passwords.js";
import { parseOrderText } from "../modules/voice/parser.js";
import { ensureAdmin } from "./bootstrap.js";
import { migrate } from "./migrate.js";
import { pool, withTransaction } from "./pool.js";

/**
 * Demo data matching the frontend mock data (villages, shops and salespersons from the PRD).
 * Skips seeding when villages already exist, so it is safe to run repeatedly.
 * Demo salesperson password: sales123.
 */

const VILLAGES = [
  { key: "v-1", mr: "सांगोला", en: "Sangola", taluka: "Sangola" },
  { key: "v-2", mr: "अकलूज", en: "Akluj", taluka: "Malshiras" },
  { key: "v-3", mr: "वाखरी", en: "Wakhari", taluka: "Pandharpur" },
  { key: "v-4", mr: "मंगळवेढा", en: "Mangalwedha", taluka: "Mangalwedha" },
  { key: "v-5", mr: "पंढरपूर", en: "Pandharpur", taluka: "Pandharpur" },
];

const SALESPERSONS = [
  { key: "sp-1", name: "अमोल पाटील", nameEn: "Amol Patil", email: "amol@jain.com", mobile: "+91 98220 12345", status: "ACTIVE", villages: ["v-1", "v-2"] },
  { key: "sp-2", name: "संतोष शिंदे", nameEn: "Santosh Shinde", email: "santosh@jain.com", mobile: "+91 98220 23456", status: "ACTIVE", villages: ["v-3", "v-4"] },
  { key: "sp-3", name: "राहुल जाधव", nameEn: "Rahul Jadhav", email: "rahul@jain.com", mobile: "+91 98220 34567", status: "INACTIVE", villages: ["v-5"] },
];

const SHOPS = [
  { key: "s-1", name: "श्री गणेश किराणा स्टोअर्स", nameEn: "Shri Ganesh Kirana Stores", owner: "गणेश कुलकर्णी", ownerEn: "Ganesh Kulkarni", mobile: "+91 94230 11223", village: "v-1", address: "मेन रोड, बस स्टँड जवळ, सांगोला", addressEn: "Near Bus Stand, Main Road, Sangola", balance: 4500 },
  { key: "s-2", name: "साई किराणा स्टोअर्स", nameEn: "Sai Kirana Stores", owner: "विष्णू कदम", ownerEn: "Vishnu Kadam", mobile: "+91 94230 44556", village: "v-1", address: "शिवाजी चौक, सांगोला", addressEn: "Shivaji Chowk, Sangola", balance: 1200 },
  { key: "s-3", name: "माऊली ट्रेडर्स", nameEn: "Mauli Traders", owner: "दत्तात्रय पवार", ownerEn: "Dattatray Pawar", mobile: "+91 94230 77889", village: "v-1", address: "मार्केट यार्ड, सांगोला", addressEn: "Market Yard, Sangola", balance: 0 },
  { key: "s-4", name: "समर्थ किराणा भंडार", nameEn: "Samarth Kirana Bhandar", owner: "सुरेश देशमुख", ownerEn: "Suresh Deshmukh", mobile: "+91 98500 12345", village: "v-2", address: "स्टेशन रोड, अकलूज", addressEn: "Station Road, Akluj", balance: 3100 },
  { key: "s-5", name: "जय भवानी किराणा", nameEn: "Jai Bhavani Kirana", owner: "आनंद शिंदे", ownerEn: "Anand Shinde", mobile: "+91 98500 67890", village: "v-2", address: "गांधी चौक, अकलूज", addressEn: "Gandhi Chowk, Akluj", balance: 850 },
  { key: "s-6", name: "विठ्ठल कृपा प्रोव्हिजन", nameEn: "Vitthal Krupa Provision", owner: "पांडुरंग काळे", ownerEn: "Pandurang Kale", mobile: "+91 97630 11223", village: "v-3", address: "मंदिर रस्ता, वाखरी", addressEn: "Temple Road, Wakhari", balance: 2400 },
  { key: "s-7", name: "कृष्णा ट्रेडर्स", nameEn: "Krishna Traders", owner: "महादेव जाधव", ownerEn: "Mahadev Jadhav", mobile: "+91 98600 99887", village: "v-4", address: "नगरपालिका चौक, मंगळवेढा", addressEn: "Municipality Chowk, Mangalwedha", balance: 5200 },
];

const ORDERS = [
  { salesperson: "sp-1", shop: "s-1", text: "दहा किलो साखर आणि पाच किलो तांदूळ द्या." },
  { salesperson: "sp-1", shop: "s-2", text: "दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स." },
  { salesperson: "sp-2", shop: "s-6", text: "पाच लिटर शेंगदाणा तेल आणि दोन किलो चहा पावडर." },
];

export async function seed(): Promise<boolean> {
  const existing = await pool.query("SELECT 1 FROM villages LIMIT 1");
  if (existing.rowCount) {
    logger.info("Villages already present, skipping demo seed");
    return false;
  }
  const passwordHash = await hashPassword("sales123");

  await withTransaction(async (client) => {
    const villageIds: Record<string, string> = {};
    for (const v of VILLAGES) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO villages (marathi_name, english_name, taluka, district) VALUES ($1, $2, $3, 'Solapur') RETURNING id`,
        [v.mr, v.en, v.taluka],
      );
      villageIds[v.key] = rows[0].id;
    }

    const userIds: Record<string, string> = {};
    for (const sp of SALESPERSONS) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO users (name, name_en, email, mobile, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5, 'SALESPERSON', $6)
         ON CONFLICT DO NOTHING RETURNING id`,
        [sp.name, sp.nameEn, sp.email, sp.mobile, passwordHash, sp.status],
      );
      if (!rows[0]) continue;
      userIds[sp.key] = rows[0].id;
      for (const v of sp.villages) {
        await client.query(`INSERT INTO salesperson_villages (salesperson_id, village_id) VALUES ($1, $2)`, [
          rows[0].id,
          villageIds[v],
        ]);
      }
    }

    const shopIds: Record<string, { id: string; village: string }> = {};
    for (const s of SHOPS) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO shops (name, name_en, owner_name, owner_name_en, mobile, address, address_en, village_id, outstanding_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [s.name, s.nameEn, s.owner, s.ownerEn, s.mobile, s.address, s.addressEn, villageIds[s.village], s.balance],
      );
      shopIds[s.key] = { id: rows[0].id, village: villageIds[s.village] };
    }

    for (const o of ORDERS) {
      const salespersonId = userIds[o.salesperson];
      if (!salespersonId) continue;
      const shop = shopIds[o.shop];
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO orders (salesperson_id, village_id, shop_id, transcribed_text, items)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [salespersonId, shop.village, shop.id, o.text, JSON.stringify(parseOrderText(o.text).items)],
      );
      await client.query(
        `INSERT INTO visits (salesperson_id, village_id, shop_id, order_id) VALUES ($1, $2, $3, $4)`,
        [salespersonId, shop.village, shop.id, rows[0].id],
      );
    }
  });
  logger.info("Seeded demo villages, shops, salespersons and orders");
  return true;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  migrate()
    .then(ensureAdmin)
    .then(seed)
    .then(() => pool.end())
    .catch((err) => {
      logger.error({ err }, "Seed failed");
      process.exit(1);
    });
}
