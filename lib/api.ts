import type { Order, OrderItem, Salesperson, Shop, Village } from "@/data/types";

/** Base URL of the backend API, baked in at build time. Same-origin `/api/v1` when unset. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");

/** localStorage key holding the JWT returned by POST /auth/login. */
export const TOKEN_KEY = "jd_token";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode): the session lasts until the tab is closed.
  }
}

/** fetch() against the API with the bearer token; JSON bodies are encoded, FormData is sent as is. */
export async function apiFetch<T = unknown>(path: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init.body instanceof FormData) {
    body = init.body;
  } else if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Check your internet connection.");
  }
  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error ?? {};
    throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? `Request failed (${res.status})`);
  }
  return json as T;
}

/* ---------- API response → UI shape mappers ---------- */

type Nullable<T> = { [K in keyof T]: T[K] | null };

export interface ApiUser {
  id: string;
  name: string;
  nameEn: string | null;
  email: string;
  mobile: string | null;
  role: "ADMIN" | "SALESPERSON";
  status: "ACTIVE" | "INACTIVE";
  assignedVillages?: { id: string }[];
}

export function toVillage(v: Nullable<Village> & { id: string }): Village {
  return {
    id: v.id,
    marathiName: v.marathiName ?? "",
    englishName: v.englishName ?? "",
    taluka: v.taluka ?? "",
    district: v.district ?? "",
    status: v.status ?? undefined,
    shopsCount: v.shopsCount ?? 0,
    visitsToday: v.visitsToday ?? 0,
    ordersToday: v.ordersToday ?? 0,
  };
}

interface ApiShop {
  id: string;
  name: string;
  nameEn: string | null;
  ownerName: string | null;
  ownerNameEn: string | null;
  mobile: string | null;
  address: string | null;
  addressEn: string | null;
  villageId: string;
  outstandingBalance: string | number | null;
}

export function toShop(s: ApiShop): Shop {
  return {
    id: s.id,
    name: s.name,
    nameEn: s.nameEn ?? "",
    owner: s.ownerName ?? "",
    ownerEn: s.ownerNameEn ?? "",
    mobile: s.mobile ?? "",
    villageId: s.villageId,
    address: s.address ?? "",
    addressEn: s.addressEn ?? "",
    outstandingBalance: Number(s.outstandingBalance ?? 0),
  };
}

/** UI fields → API body for POST/PATCH /shops (only the keys that are present). */
export function fromShop(s: Partial<Shop>) {
  const body: Record<string, unknown> = {};
  if (s.name !== undefined) body.name = s.name;
  if (s.nameEn !== undefined) body.nameEn = s.nameEn || null;
  if (s.owner !== undefined) body.ownerName = s.owner || null;
  if (s.ownerEn !== undefined) body.ownerNameEn = s.ownerEn || null;
  if (s.mobile !== undefined) body.mobile = s.mobile.trim() || null;
  if (s.address !== undefined) body.address = s.address || null;
  if (s.addressEn !== undefined) body.addressEn = s.addressEn || null;
  if (s.villageId !== undefined) body.villageId = s.villageId;
  if (s.outstandingBalance !== undefined) body.outstandingBalance = s.outstandingBalance;
  return body;
}

interface ApiSalesperson {
  id: string;
  name: string;
  nameEn: string | null;
  email: string;
  mobile: string | null;
  status: "ACTIVE" | "INACTIVE";
  todayVisits: number;
  todayOrders: number;
  assignedVillages: { id: string }[];
}

export function toSalesperson(sp: ApiSalesperson): Salesperson {
  return {
    id: sp.id,
    name: sp.name,
    nameEn: sp.nameEn ?? "",
    email: sp.email,
    mobile: sp.mobile ?? "",
    status: sp.status,
    todayVisits: sp.todayVisits ?? 0,
    todayOrders: sp.todayOrders ?? 0,
    assignedVillages: (sp.assignedVillages ?? []).map((v) => v.id),
  };
}

export interface ApiOrderItem {
  name: string;
  nameEn?: string;
  quantity: number;
  unit: string;
  unitCode?: string;
}

/** API item → UI item ("रवा (Rava)"). Units already come as "किलो (kg)". */
export function toOrderItem(i: ApiOrderItem): OrderItem {
  const name = i.nameEn && i.nameEn !== i.name ? `${i.name} (${i.nameEn})` : i.name;
  return { name, quantity: Number(i.quantity), unit: i.unit };
}

/** UI item → API item, splitting "रवा (Rava)" back into name / nameEn. */
export function fromOrderItem(i: OrderItem): ApiOrderItem {
  const m = i.name.match(/^(.*?)\s*\((.*?)\)$/);
  return m ? { name: m[1], nameEn: m[2], quantity: i.quantity, unit: i.unit } : { name: i.name, quantity: i.quantity, unit: i.unit };
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ApiOrder {
  id: string;
  displayId: string;
  salespersonId: string;
  villageId: string;
  shopId: string;
  transcribedText: string;
  items: ApiOrderItem[];
  status: Order["status"];
  createdAt: string;
}

export function toOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    displayId: o.displayId,
    salespersonId: o.salespersonId,
    villageId: o.villageId,
    shopId: o.shopId,
    transcribedText: o.transcribedText,
    items: (o.items ?? []).map(toOrderItem),
    status: o.status,
    createdAt: formatDateTime(o.createdAt),
    createdAtIso: o.createdAt,
  };
}

/** Today's date (YYYY-MM-DD) in India time, which is the API's business day. */
export function todayIST(): string {
  return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
}
