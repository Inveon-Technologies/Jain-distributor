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
    const res = await api().post("/api/v1/auth/login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(["email", "password"]);
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

describe("voice", () => {
  it("transcribes an uploaded recording and parses items", async () => {
    const res = await api()
      .post("/api/v1/voice/transcribe")
      .set(auth(sales))
      .attach("audio", Buffer.alloc(4000), { filename: "order.webm", contentType: "audio/webm" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      text: MOCK_TRANSCRIPT,
      provider: "mock",
      language: "mr-IN",
      unparsed: [],
      needsReview: false,
      lowConfidenceWords: [],
    });
    expect(res.body.data.items).toHaveLength(4);
    expect(res.body.data.summary).toContain("रवा – 10 किलो");
  });

  it("rejects recordings that are too short to contain speech", async () => {
    const res = await api()
      .post("/api/v1/voice/transcribe")
      .set(auth(sales))
      .attach("audio", Buffer.from("tiny"), { filename: "order.webm", contentType: "audio/webm" });
    expect(res.status).toBe(400);
  });

  it("reports which speech provider the app should use", async () => {
    const res = await api().get("/api/v1/voice/config").set(auth(sales));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ provider: "mock", language: "mr-IN" });
  });

  it("requires an audio file", async () => {
    const res = await api().post("/api/v1/voice/transcribe").set(auth(sales));
    expect(res.status).toBe(400);
  });

  it("re-parses edited text", async () => {
    const res = await api().post("/api/v1/voice/parse").set(auth(sales)).send({ text: "पाच किलो साखर" });
    expect(res.body.data.items).toEqual([
      { name: "साखर", nameEn: "Sugar", quantity: 5, unit: "किलो (kg)", unitCode: "KG" },
    ]);
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
    expect(res.body.data.items).toHaveLength(4);
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

  it("deleting a village hides it and its shops but keeps orders", async () => {
    expect((await api().delete(`/api/v1/villages/${sangola}`).set(auth(admin))).status).toBe(204);
    expect((await api().get(`/api/v1/shops/${shopId}`).set(auth(admin))).status).toBe(404);
    expect((await api().get(`/api/v1/orders/${orderId}`).set(auth(admin))).status).toBe(200);
  });
});
