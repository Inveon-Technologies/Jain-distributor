import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { adminToken, api, auth, login, MOCK_TRANSCRIPT, resetDatabase } from "./helpers.js";

let admin: string;
let sales: string;
let otherSales: string;
let salespersonId: string;
let sangola: string;
let akluj: string;
let shopId: string;

beforeAll(async () => {
  await resetDatabase();
  admin = await adminToken();
});

afterAll(async () => {
  await pool.end();
});

describe("health", () => {
  it("reports liveness and database readiness", async () => {
    expect((await api().get("/health")).body.status).toBe("ok");
    expect((await api().get("/health/ready")).body).toEqual({ status: "ready", database: "up" });
  });

  it("returns JSON 404s for unknown routes", async () => {
    const res = await api().get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("auth", () => {
  it("rejects bad credentials and missing tokens", async () => {
    const bad = await api().post("/api/v1/auth/login").send({ email: "admin@jain.com", password: "wrong" });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe("INVALID_CREDENTIALS");

    expect((await api().get("/api/v1/auth/me")).status).toBe(401);
    expect((await api().get("/api/v1/auth/me").set(auth("garbage"))).body.error.code).toBe("INVALID_TOKEN");
  });

  it("validates the login body", async () => {
    const res = await api().post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(["password"]);
    const noId = await api().post("/api/v1/auth/login").send({ password: "x" });
    expect(noId.body.error.details.map((d: { path: string }) => d.path)).toEqual(["login"]);

    const bad = await api().post("/api/v1/auth/login").send({ login: "not-an-email", password: "x" });
    expect(bad.status).toBe(400);
  });

  it("returns the admin profile", async () => {
    const res = await api().get("/api/v1/auth/me").set(auth(admin));
    expect(res.body.user).toMatchObject({ email: "admin@jain.com", role: "ADMIN", status: "ACTIVE" });
  });

  it("self-registration stays pending until an admin activates the account", async () => {
    const reg = await api()
      .post("/api/v1/auth/register")
      .send({ name: "सचिन माने", nameEn: "Sachin Mane", email: "Sachin@Jain.com", mobile: "+91 90000 11111", password: "secret1" });
    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({ pendingApproval: true, user: { status: "INACTIVE", email: "sachin@jain.com" } });

    const dup = await api()
      .post("/api/v1/auth/register")
      .send({ name: "Dup", email: "sachin@jain.com", mobile: "9000011111", password: "secret1" });
    expect(dup.status).toBe(409);

    const blocked = await api().post("/api/v1/auth/login").send({ email: "sachin@jain.com", password: "secret1" });
    expect(blocked.body.error.code).toBe("ACCOUNT_INACTIVE");

    const activate = await api()
      .patch(`/api/v1/salespersons/${reg.body.user.id}/status`)
      .set(auth(admin))
      .send({ status: "ACTIVE" });
    expect(activate.body.data.status).toBe("ACTIVE");
    otherSales = await login("sachin@jain.com", "secret1");

    // The same account by mobile number, written any common way.
    for (const id of ["9000011111", "+91 90000 11111", "09000011111", "+91-90000-11111"]) {
      const res = await api().post("/api/v1/auth/login").send({ login: id, password: "secret1" });
      expect(res.status, id).toBe(200);
      expect(res.body.user.email).toBe("sachin@jain.com");
    }
    const wrongPass = await api().post("/api/v1/auth/login").send({ login: "9000011111", password: "nope" });
    expect(wrongPass.body.error.code).toBe("INVALID_CREDENTIALS");
    const unknown = await api().post("/api/v1/auth/login").send({ login: "9111111111", password: "secret1" });
    expect(unknown.body.error.code).toBe("INVALID_CREDENTIALS");
    // Older clients that still send `email`.
    expect((await api().post("/api/v1/auth/login").send({ email: "Sachin@Jain.com", password: "secret1" })).status).toBe(200);

    // A mobile number can belong to only one account.
    const sameMobile = await api()
      .post("/api/v1/salespersons")
      .set(auth(admin))
      .send({ name: "Other", email: "other@jain.com", mobile: "+919000011111", password: "secret1" });
    expect(sameMobile.status).toBe(409);
  });

  it("locks an account after 5 failed password attempts and admin can unlock", async () => {
    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const res = await api().post("/api/v1/auth/login").send({ email: "sachin@jain.com", password: "wrong" });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    }
    // 5th failed attempt locks the account
    const lockedRes = await api().post("/api/v1/auth/login").send({ email: "sachin@jain.com", password: "wrong" });
    expect(lockedRes.status).toBe(401);
    expect(lockedRes.body.error.code).toBe("ACCOUNT_LOCKED");

    // Even with correct password, login is blocked
    const blockedRes = await api().post("/api/v1/auth/login").send({ email: "sachin@jain.com", password: "secret1" });
    expect(blockedRes.status).toBe(401);
    expect(blockedRes.body.error.code).toBe("ACCOUNT_LOCKED");

    // Admin lists salespersons and sees the account is locked
    const spList = await api().get("/api/v1/salespersons").set(auth(admin));
    const sachin = spList.body.data.find((s: { email: string }) => s.email === "sachin@jain.com");
    expect(sachin.isLocked).toBe(true);

    // Admin unlocks the salesperson
    const unlockRes = await api().post(`/api/v1/salespersons/${sachin.id}/unlock`).set(auth(admin));
    expect(unlockRes.status).toBe(200);

    // Now login succeeds
    const successRes = await api().post("/api/v1/auth/login").send({ email: "sachin@jain.com", password: "secret1" });
    expect(successRes.status).toBe(200);
  });
});

describe("villages", () => {
  it("admin creates, updates and lists villages", async () => {
    const created = await api()
      .post("/api/v1/villages")
      .set(auth(admin))
      .send({ marathiName: "सांगोला", englishName: "Sangola", taluka: "Sangola", district: "Solapur" });
    expect(created.status).toBe(201);
    sangola = created.body.data.id;

    akluj = (
      await api().post("/api/v1/villages").set(auth(admin)).send({ marathiName: "अकलूज", englishName: "Akluj" })
    ).body.data.id;

    const dup = await api().post("/api/v1/villages").set(auth(admin)).send({ marathiName: "x", englishName: "sangola" });
    expect(dup.status).toBe(409);

    const updated = await api().patch(`/api/v1/villages/${akluj}`).set(auth(admin)).send({ taluka: "Malshiras" });
    expect(updated.body.data).toMatchObject({ taluka: "Malshiras", englishName: "Akluj" });

    const list = await api().get("/api/v1/villages").set(auth(admin));
    expect(list.body.data.map((v: { englishName: string }) => v.englishName)).toEqual(["Akluj", "Sangola"]);
    expect(list.body.data[0]).toMatchObject({ shopsCount: 0, visitsToday: 0, ordersToday: 0 });
  });
});

describe("salespersons", () => {
  it("admin creates a salesperson with assigned villages", async () => {
    const res = await api()
      .post("/api/v1/salespersons")
      .set(auth(admin))
      .send({
        name: "अमोल पाटील",
        nameEn: "Amol Patil",
        email: "amol@jain.com",
        mobile: "+91 98220 12345",
        password: "sales123",
        assignedVillageIds: [sangola],
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: "ACTIVE", todayOrders: 0, assignedVillages: [{ englishName: "Sangola" }] });
    salespersonId = res.body.data.id;
    sales = await login("amol@jain.com", "sales123");

    const me = await api().get("/api/v1/auth/me").set(auth(sales));
    expect(me.body.user.assignedVillages).toHaveLength(1);
  });

  it("salespersons cannot use admin endpoints", async () => {
    expect((await api().get("/api/v1/salespersons").set(auth(sales))).status).toBe(403);
    expect((await api().get("/api/v1/dashboard/summary").set(auth(sales))).status).toBe(403);
    expect((await api().post("/api/v1/villages").set(auth(sales)).send({ marathiName: "a", englishName: "b" })).status).toBe(403);
  });

  it("salesperson sees only their assigned villages when asked", async () => {
    const res = await api().get("/api/v1/villages?assigned=true").set(auth(sales));
    expect(res.body.data.map((v: { englishName: string }) => v.englishName)).toEqual(["Sangola"]);
    const all = await api().get("/api/v1/villages").set(auth(sales));
    expect(all.body.data).toHaveLength(2);
  });

  it("deactivation takes effect immediately for existing tokens", async () => {
    const tempId = (
      await api()
        .post("/api/v1/salespersons")
        .set(auth(admin))
        .send({ name: "Temp", email: "temp@jain.com", mobile: "9999999999", password: "temp123" })
    ).body.data.id;
    const token = await login("temp@jain.com", "temp123");
    await api().patch(`/api/v1/salespersons/${tempId}`).set(auth(admin)).send({ status: "INACTIVE" });
    const res = await api().get("/api/v1/auth/me").set(auth(token));
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");

    expect((await api().delete(`/api/v1/salespersons/${tempId}`).set(auth(admin))).status).toBe(204);
    expect((await api().get(`/api/v1/salespersons/${tempId}`).set(auth(admin))).status).toBe(404);
  });

  it("supports password change and admin reset", async () => {
    const wrong = await api()
      .post("/api/v1/auth/change-password")
      .set(auth(otherSales))
      .send({ currentPassword: "nope", newPassword: "newpass1" });
    expect(wrong.status).toBe(400);
    const ok = await api()
      .post("/api/v1/auth/change-password")
      .set(auth(otherSales))
      .send({ currentPassword: "secret1", newPassword: "newpass1" });
    expect(ok.status).toBe(204);
    await login("sachin@jain.com", "newpass1");

    const me = await api().get("/api/v1/auth/me").set(auth(otherSales));
    const reset = await api()
      .post(`/api/v1/salespersons/${me.body.user.id}/reset-password`)
      .set(auth(admin))
      .send({ newPassword: "reset123" });
    expect(reset.status).toBe(204);
    await login("sachin@jain.com", "reset123");
  });
});

describe("shops", () => {
  it("salesperson adds a new shop from the field", async () => {
    const res = await api()
      .post("/api/v1/shops")
      .set(auth(sales))
      .send({
        name: "साई किराणा स्टोअर्स",
        nameEn: "Sai Kirana Stores",
        ownerName: "विष्णू कदम",
        mobile: "+91 94230 44556",
        villageId: sangola,
        outstandingBalance: 999,
      });
    expect(res.status).toBe(201);
    // Only admins may set credit balances.
    expect(res.body.data).toMatchObject({ villageEnglishName: "Sangola", outstandingBalance: 0 });
    shopId = res.body.data.id;
  });

  it("rejects shops in unknown villages", async () => {
    const res = await api()
      .post("/api/v1/shops")
      .set(auth(admin))
      .send({ name: "X", villageId: "00000000-0000-4000-8000-000000000000" });
    expect(res.status).toBe(400);
  });

  it("filters, searches and paginates shops", async () => {
    await api().post("/api/v1/shops").set(auth(admin)).send({ name: "माऊली ट्रेडर्स", nameEn: "Mauli Traders", villageId: akluj });
    const byVillage = await api().get(`/api/v1/shops?villageId=${sangola}`).set(auth(sales));
    expect(byVillage.body.data).toHaveLength(1);
    const search = await api().get("/api/v1/shops?q=mauli").set(auth(sales));
    expect(search.body.data[0].nameEn).toBe("Mauli Traders");
    const page = await api().get("/api/v1/shops?pageSize=1&page=2").set(auth(admin));
    expect(page.body.meta).toEqual({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
  });

  it("salespersons edit shop details but only admins set the balance or delete", async () => {
    const edited = await api().patch(`/api/v1/shops/${shopId}`).set(auth(sales)).send({ mobile: "+91 90000 11111", outstandingBalance: 99 });
    expect(edited.status).toBe(200);
    expect(edited.body.data.mobile).toBe("+91 90000 11111");
    expect(edited.body.data.outstandingBalance).not.toBe(99);
    expect((await api().delete(`/api/v1/shops/${shopId}`).set(auth(sales))).status).toBe(403);
    const res = await api().patch(`/api/v1/shops/${shopId}`).set(auth(admin)).send({ outstandingBalance: 1200.5 });
    expect(res.body.data.outstandingBalance).toBe(1200.5);
  });
});

describe("item master", () => {
  it("is loaded with the distributor's item list", async () => {
    const res = await api().get("/api/v1/items").set(auth(admin)).query({ pageSize: 5 });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3996);
    expect(res.body.data[0]).toMatchObject({ name: "2 LOVE MR KING RS 20", unit: "JAR 15", packType: "JAR", packQty: 15, price: 20 });
  });

  it("searches by English name, and by sound for Marathi", async () => {
    const en = await api().get("/api/v1/items").set(auth(sales)).query({ q: "parle g" });
    expect(en.body.data.length).toBeGreaterThan(0);
    expect(en.body.data.every((i: { name: string }) => i.name.includes("PARLE G"))).toBe(true);

    const mr = await api().get("/api/v1/items").set(auth(sales)).query({ q: "कोलगेट पेस्ट ₹20" });
    expect(mr.body.data[0].name).toBe("COLGATE PASTE RS 20");

    const suggest = await api().get("/api/v1/items/suggest").set(auth(sales)).query({ q: "डेटॉल साबण" });
    expect(suggest.body.data[0].name).toMatch(/^DETTOL SOAP/);
  });

  let itemId: string;
  it("admins add, edit and remove items; salespersons cannot", async () => {
    const denied = await api().post("/api/v1/items").set(auth(sales)).send({ name: "TEST ITEM" });
    expect(denied.status).toBe(403);

    const created = await api()
      .post("/api/v1/items")
      .set(auth(admin))
      .send({ name: "  shree  ganesh  agarbatti rs : 25 ", unit: "packet 12", marathiName: "श्री गणेश अगरबत्ती" });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: "SHREE GANESH AGARBATTI RS 25",
      unit: "PKT 12",
      packType: "PKT",
      packQty: 12,
      price: 25,
      marathiName: "श्री गणेश अगरबत्ती",
      aliases: [],
    });
    itemId = created.body.data.id;

    const dup = await api().post("/api/v1/items").set(auth(admin)).send({ name: "SHREE GANESH AGARBATTI RS 25", unit: "PKT 12" });
    expect(dup.status).toBe(409);

    const edited = await api()
      .patch(`/api/v1/items/${itemId}`)
      .set(auth(admin))
      .send({ aliases: ["गणेश उदबत्ती", "गणेश उदबत्ती"], price: 30 });
    expect(edited.body.data).toMatchObject({ aliases: ["गणेश उदबत्ती"], price: 30, unit: "PKT 12" });

    // The new alias is used for matching straight away.
    const suggest = await api().get("/api/v1/items/suggest").set(auth(sales)).query({ q: "गणेश उदबत्ती" });
    expect(suggest.body.data[0].id).toBe(itemId);
  });

  it("imports a pasted list, skipping items already in the master", async () => {
    const text = "item_name\titem_size\nPARLE G RS 10\tPCS\nNEW  BRAND SOAP RS 12\tPACKET 6\nNEW BRAND SOAP RS 12\tPKT 6\n\tPCS\n";
    const res = await api().post("/api/v1/items/import").set(auth(admin)).send({ text });
    expect(res.status).toBe(200);
    // Skipped: the duplicate "NEW BRAND SOAP" line and the row without a name (line 1 is the header).
    expect(res.body.data).toMatchObject({ read: 2, added: 1, updated: 0, alreadyInMaster: 1, skippedCount: 2 });
    const found = await api().get("/api/v1/items").set(auth(admin)).query({ q: "NEW BRAND SOAP" });
    expect(found.body.data).toHaveLength(1);
    expect(found.body.data[0]).toMatchObject({ unit: "PKT 6", packQty: 6, price: 12 });
  });

  it("exports the master as CSV that imports back, updating Marathi names, aliases and MRP", async () => {
    const res = await api().get("/api/v1/items/export").set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toMatch(/attachment; filename="item-master-\d{4}-\d{2}-\d{2}\.csv"/);
    const lines = res.text.replace(/^\uFEFF/, "").trim().split("\r\n");
    expect(lines[0]).toBe("name,packing,mrp,marathi_name,spoken_names,status");
    expect(lines).toHaveLength(1 + 3996 + 2); // header, seeded items, the item added above and the imported one
    expect(lines).toContain("SHREE GANESH AGARBATTI RS 25,PKT 12,30,श्री गणेश अगरबत्ती,गणेश उदबत्ती,ACTIVE");
    expect((await api().get("/api/v1/items/export").set(auth(sales))).status).toBe(403);

    const edited = "name,packing,mrp,marathi_name,spoken_names,status\r\n" +
      '"NEW BRAND SOAP RS 12",PKT 6,15,न्यू ब्रँड साबण,"नवीन साबण | ब्रँड साबण",INACTIVE\r\n';
    const keep = await api().post("/api/v1/items/import").set(auth(admin)).send({ text: edited });
    expect(keep.body.data).toMatchObject({ read: 1, added: 0, updated: 0, alreadyInMaster: 1 });
    const upd = await api().post("/api/v1/items/import").set(auth(admin)).send({ text: edited, update: true });
    expect(upd.body.data).toMatchObject({ read: 1, added: 0, updated: 1, alreadyInMaster: 0 });
    const found = await api().get("/api/v1/items").set(auth(admin)).query({ q: "NEW BRAND SOAP" });
    expect(found.body.data[0]).toMatchObject({
      price: 15,
      marathiName: "न्यू ब्रँड साबण",
      aliases: ["नवीन साबण", "ब्रँड साबण"],
      status: "INACTIVE",
    });
  });

  it("re-parses typed order text into items with suggestions", async () => {
    const res = await api().post("/api/v1/items/parse").set(auth(sales)).send({ text: "पाच किलो साखर" });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({ name: "साखर", quantity: 5, unit: "किलो (kg)", unitCode: "KG" });
    expect(Array.isArray(res.body.data.items[0].suggestions)).toBe(true);
    expect((await api().post("/api/v1/items/parse").set(auth(sales)).send({})).status).toBe(400);
    expect((await api().post("/api/v1/items/parse").send({ text: "x" })).status).toBe(401);
  });

  it("matches typed Marathi to Item Master items, reading the price apart from the quantity", async () => {
    const res = await api()
      .post("/api/v1/items/parse")
      .set(auth(sales))
      .send({ text: "पार्ले जी दहा रुपये वीस पॅकेट आणि चार निव्हिया क्रीम" });
    const [parle, nivea] = res.body.data.items;
    expect(parle).toMatchObject({ name: "पार्ले जी ₹10", quantity: 20, unitCode: "PACKET", itemName: "PARLE G RS 10" });
    expect(parle.itemId).toBe(parle.suggestions[0].id);
    expect(nivea).toMatchObject({ name: "निव्हिया क्रीम", quantity: 4 });
  });

  it("removed voice endpoints are gone", async () => {
    expect((await api().post("/api/v1/voice/transcribe").set(auth(sales))).status).toBe(404);
    expect((await api().get("/api/v1/voice/config").set(auth(sales))).status).toBe(404);
  });

  it("keeps only Item Master products in orders", async () => {
    const res = await api()
      .post("/api/v1/items/parse")
      .set(auth(sales))
      .send({ text: "चार निव्हिया क्रीम, दोन नमस्कार किलो, पाच झिंगालाला पाकीट" });
    expect(res.body.data.items.map((i: { name: string }) => i.name)).toEqual(["निव्हिया क्रीम"]);
    expect(res.body.data.notInMaster).toEqual(["नमस्कार 2 किलो", "झिंगालाला 5 पॅकेट"]);
    expect(res.body.data.ignored).toEqual(expect.arrayContaining(["नमस्कार 2 किलो", "झिंगालाला 5 पॅकेट"]));
    expect(res.body.data.formattedText).toBe("निव्हिया क्रीम 4 नग");
  });

  it("deletes items softly", async () => {
    expect((await api().delete(`/api/v1/items/${itemId}`).set(auth(admin))).status).toBe(204);
    expect((await api().get(`/api/v1/items/${itemId}`).set(auth(admin))).status).toBe(404);
  });
});

describe("orders, visits and dashboard", () => {
  let orderId: string;

  it("salesperson records a village check-in", async () => {
    const res = await api().post("/api/v1/visits").set(auth(sales)).send({ villageId: sangola });
    expect(res.status).toBe(201);
    const bad = await api().post("/api/v1/visits").set(auth(sales)).send({ villageId: akluj, shopId });
    expect(bad.status).toBe(400);
  });

  it("salesperson saves a voice order; items are parsed when not supplied", async () => {
    const res = await api().post("/api/v1/orders").set(auth(sales)).send({ shopId, transcribedText: MOCK_TRANSCRIPT });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      displayId: "ORD-1001",
      status: "CONFIRMED",
      villageId: sangola,
      salesperson: { nameEn: "Amol Patil" },
      shop: { nameEn: "Sai Kirana Stores" },
    });
    expect(res.body.data.items).toHaveLength(3);
    orderId = res.body.data.id;
  });

  it("keeps reviewed items sent by the client", async () => {
    const items = [{ name: "रवा (Rava)", quantity: 12, unit: "किलो (kg)" }];
    const res = await api()
      .post("/api/v1/orders")
      .set(auth(otherSales))
      .send({ shopId, transcribedText: "बारा किलो रवा", items });
    expect(res.body.data.items).toEqual(items);
  });

  it("rejects orders with nothing readable", async () => {
    const res = await api().post("/api/v1/orders").set(auth(sales)).send({ shopId, transcribedText: "नमस्कार" });
    expect(res.status).toBe(400);
  });

  it("admins cannot create orders", async () => {
    const res = await api().post("/api/v1/orders").set(auth(admin)).send({ shopId, transcribedText: "पाच किलो साखर" });
    expect(res.status).toBe(403);
  });

  it("salespersons only see their own orders", async () => {
    const mine = await api().get("/api/v1/orders").set(auth(sales));
    expect(mine.body.meta.total).toBe(1);
    const other = await api().get("/api/v1/orders").set(auth(otherSales));
    expect(other.body.meta.total).toBe(1);
    expect((await api().get(`/api/v1/orders/${orderId}`).set(auth(otherSales))).status).toBe(403);
  });

  it("admin filters orders and updates status", async () => {
    const all = await api().get("/api/v1/orders").set(auth(admin));
    expect(all.body.meta.total).toBe(2);
    const filtered = await api().get(`/api/v1/orders?salespersonId=${salespersonId}&q=ORD-1001`).set(auth(admin));
    expect(filtered.body.data.map((o: { id: string }) => o.id)).toEqual([orderId]);
    const none = await api().get("/api/v1/orders?date=2000-01-01").set(auth(admin));
    expect(none.body.meta.total).toBe(0);

    const delivered = await api().patch(`/api/v1/orders/${orderId}`).set(auth(admin)).send({ status: "DELIVERED" });
    expect(delivered.body.data.status).toBe("DELIVERED");
    expect((await api().patch(`/api/v1/orders/${orderId}`).set(auth(admin)).send({ status: "LOST" })).status).toBe(400);
    expect((await api().patch(`/api/v1/orders/${orderId}`).set(auth(sales)).send({ status: "CANCELLED" })).status).toBe(403);
  });

  it("dashboard reflects today's activity", async () => {
    const summary = await api().get("/api/v1/dashboard/summary").set(auth(admin));
    expect(summary.body.data).toMatchObject({
      activeSalespersons: 2,
      totalSalespersons: 2,
      salespersonsInFieldToday: 2,
      villageVisitsToday: 2,
      shopsVisitedToday: 1,
      ordersToday: 2,
      totalVillages: 2,
      totalShops: 2,
    });

    const villages = await api().get("/api/v1/villages").set(auth(admin));
    const s = villages.body.data.find((v: { id: string }) => v.id === sangola);
    expect(s).toMatchObject({ visitsToday: 2, shopsVisitedToday: 1, ordersToday: 2, shopsCount: 1 });

    const people = await api().get(`/api/v1/salespersons/${salespersonId}`).set(auth(admin));
    expect(people.body.data).toMatchObject({ todayVisits: 1, todayVillageVisits: 1, todayOrders: 1 });

    const recent = await api().get("/api/v1/dashboard/recent-orders?limit=1").set(auth(admin));
    expect(recent.body.data).toHaveLength(1);

    const visits = await api().get("/api/v1/visits").set(auth(admin));
    expect(visits.body.data).toHaveLength(3);
  });

  it("dashboard cards, tables and salesperson counts always agree", async () => {
    const item = { name: "पार्ले जी", quantity: 1, unit: "नग" };
    const mk = async (email: string, mobile: string) => {
      const created = await api()
        .post("/api/v1/salespersons")
        .set(auth(admin))
        .send({ name: "चाचणी", nameEn: email, email, mobile, password: "secret123" });
      return { id: created.body.data.id as string, token: await login(email, "secret123") };
    };
    const a = await mk("consistency-a@jain.com", "9000000001");
    const b = await mk("consistency-b@jain.com", "9000000002");
    const village = (
      await api().post("/api/v1/villages").set(auth(admin)).send({ marathiName: "चाचणी", englishName: "Consistency" })
    ).body.data.id as string;
    const shop = (
      await api().post("/api/v1/shops").set(auth(a.token)).send({ name: "चाचणी दुकान", villageId: village })
    ).body.data.id as string;
    const place = (token: string) =>
      api().post("/api/v1/orders").set(auth(token)).send({ shopId: shop, transcribedText: "पार्ले जी", items: [item] });

    const before = (await api().get("/api/v1/dashboard/summary").set(auth(admin))).body.data.ordersToday as number;
    await place(a.token);
    await place(a.token);
    const cancelled = (await place(a.token)).body.data.id as string;
    await api().patch(`/api/v1/orders/${cancelled}`).set(auth(admin)).send({ status: "CANCELLED" });
    await place(b.token);

    const sum = async () => (await api().get("/api/v1/dashboard/summary").set(auth(admin))).body.data;
    const tables = async () => {
      const people = (await api().get("/api/v1/salespersons").set(auth(admin))).body.data as { todayOrders: number }[];
      const villages = (await api().get("/api/v1/villages").set(auth(admin))).body.data as { ordersToday: number }[];
      return {
        people: people.reduce((n, p) => n + p.todayOrders, 0),
        villages: villages.reduce((n, v) => n + v.ordersToday, 0),
      };
    };

    // Cancelled orders are not counted anywhere: 3 live orders were added.
    expect((await sum()).ordersToday).toBe(before + 3);
    expect(await tables()).toEqual({ people: before + 3, villages: before + 3 });
    // The salesperson's own list shows the cancelled order, but their "recorded" count must not.
    const own = await api().get("/api/v1/orders?pageSize=500").set(auth(a.token));
    const live = own.body.data.filter((o: { status: string }) => o.status !== "CANCELLED");
    expect(live).toHaveLength(2);
    expect((await api().get(`/api/v1/salespersons/${a.id}`).set(auth(admin))).body.data.todayOrders).toBe(2);

    // Removing a salesperson takes their orders out of the cards and the tables together.
    await api().delete(`/api/v1/salespersons/${b.id}`).set(auth(admin));
    expect((await sum()).ordersToday).toBe(before + 2);
    expect(await tables()).toEqual({ people: before + 2, villages: before + 2 });
  });

  it("learns the spoken name when the salesperson picks an item by hand", async () => {
    const pick = await api().get("/api/v1/items/suggest").set(auth(sales)).query({ q: "हिमालया बेबी साबण" });
    const target = pick.body.data[0];
    const items = [{ name: "बाळू साबण", quantity: 2, unit: "नग (Piece)", itemId: target.id, itemName: target.name, itemPicked: true }];
    const res = await api().post("/api/v1/orders").set(auth(sales)).send({ shopId, transcribedText: "दोन बाळू साबण", items });
    expect(res.status).toBe(201);
    expect(res.body.data.items).toEqual([{ name: "बाळू साबण", quantity: 2, unit: "नग (Piece)", itemId: target.id, itemName: target.name }]);
    const item = await api().get(`/api/v1/items/${target.id}`).set(auth(admin));
    expect(item.body.data.aliases).toContain("बाळू साबण");
    const again = await api().get("/api/v1/items/suggest").set(auth(sales)).query({ q: "बाळू साबण" });
    expect(again.body.data[0].id).toBe(target.id);
  });

  it("deleting a village hides it and its shops but keeps orders", async () => {
    expect((await api().delete(`/api/v1/villages/${sangola}`).set(auth(admin))).status).toBe(204);
    expect((await api().get(`/api/v1/shops/${shopId}`).set(auth(admin))).status).toBe(404);
    expect((await api().get(`/api/v1/orders/${orderId}`).set(auth(admin))).status).toBe(200);
  });
});

describe("notifications", () => {
  it("lists new orders and pending sign-ups for admins only", async () => {
    const reg = await api()
      .post("/api/v1/auth/register")
      .send({ name: "नवीन", nameEn: "Navin", email: "navin@jain.com", mobile: "9000022222", password: "secret1" });
    expect(reg.status).toBe(201);

    const res = await api().get("/api/v1/notifications").set(auth(admin));
    expect(res.status).toBe(200);
    const types = res.body.data.map((n: { type: string }) => n.type);
    expect(types).toContain("NEW_ORDER");
    expect(res.body.data).toContainEqual(
      expect.objectContaining({ type: "SIGNUP", id: reg.body.user.id, data: expect.objectContaining({ nameEn: "Navin" }) }),
    );
    const order = res.body.data.find((n: { type: string }) => n.type === "NEW_ORDER");
    expect(order.data).toMatchObject({ orderNumber: expect.any(Number), shopName: expect.any(String) });
    // Newest first.
    const times = res.body.data.map((n: { createdAt: string }) => Date.parse(n.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);

    expect((await api().get("/api/v1/notifications").set(auth(sales))).status).toBe(403);
  });
});

describe("request limits", () => {
  it("accepts a large backup on the restore route but not on ordinary routes", async () => {
    const big = { padding: "x".repeat(2 * 1024 * 1024) };
    const restore = await api().post("/api/v1/dashboard/import/restore").set(auth(admin)).send(big);
    expect(restore.status).not.toBe(413);
    const ordinary = await api().post("/api/v1/villages").set(auth(admin)).send(big);
    expect(ordinary.status).toBe(413);
  });
});
