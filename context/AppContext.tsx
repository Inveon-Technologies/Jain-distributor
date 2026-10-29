"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { autoBilingualName, isDevanagari } from "@/utils/transliterate";
import { Salesperson, Village, Shop, Order, OrderItem } from "@/data/types";
import {
  ApiError,
  ApiUser,
  apiFetch,
  fromOrderItem,
  fromShop,
  getAuthToken,
  setAuthToken,
  todayIST,
  toOrder,
  toSalesperson,
  toShop,
  toVillage,
} from "@/lib/api";

export type Language = "mr" | "en";
export type UserRole = "SALESPERSON" | "ADMIN";

export interface CurrentUser {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  role: UserRole;
  mobile?: string;
  assignedVillages: string[];
}

type Result = { success: boolean; error?: string };

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  /** False until the saved session has been checked, so layouts don't redirect too early. */
  authReady: boolean;
  /** True while the first data load after login is running. */
  loading: boolean;
  currentUser: CurrentUser | null;
  login: (email: string, pass: string) => Promise<Result & { role?: UserRole }>;
  registerSalesperson: (data: { name: string; nameEn?: string; email: string; mobile: string; password: string }) => Promise<Result & { pendingApproval?: boolean }>;
  logout: () => void;
  refresh: () => Promise<void>;
  villages: Village[];
  shops: Shop[];
  orders: Order[];
  salespersons: Salesperson[];
  toggleSalespersonStatus: (salespersonId: string) => Promise<Result>;
  /** Salesperson changing their own password (needs the current one). */
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  /** Admin setting a salesperson's password. */
  resetSalespersonPassword: (salespersonId: string, newPass: string) => Promise<Result>;
  selectedVillage: Village | null;
  setSelectedVillage: (v: Village | null) => void;
  selectedShop: Shop | null;
  setSelectedShop: (s: Shop | null) => void;
  addShop: (newShop: Omit<Shop, "id">) => Promise<Shop>;
  updateShop: (shopId: string, updatedData: Partial<Shop>) => Promise<Result>;
  deleteShop: (shopId: string) => Promise<Result>;
  addVillage: (newVillage: { marathiName: string; englishName: string; taluka: string; district: string }) => Promise<Village>;
  updateVillage: (villageId: string, updatedData: Partial<Village>) => Promise<Result>;
  deleteVillage: (villageId: string) => Promise<Result>;
  addSalesperson: (data: {
    name: string;
    nameEn?: string;
    email: string;
    password: string;
    mobile: string;
    assignedVillages?: string[];
    status?: "ACTIVE" | "INACTIVE";
  }) => Promise<Salesperson>;
  updateSalesperson: (salespersonId: string, updatedData: Partial<Salesperson>) => Promise<Result>;
  deleteSalesperson: (salespersonId: string) => Promise<Result>;
  createOrder: (orderData: {
    shopId: string;
    villageId: string;
    transcribedText: string;
    items: OrderItem[];
  }) => Promise<Order>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function toCurrentUser(u: ApiUser): CurrentUser {
  return {
    id: u.id,
    name: u.name,
    nameEn: u.nameEn ?? "",
    email: u.email,
    role: u.role,
    mobile: u.mobile ?? undefined,
    assignedVillages: (u.assignedVillages ?? []).map((v) => v.id),
  };
}

/** Marathi + English versions of a name typed in either script. */
function bilingual(name: string, nameEn?: string) {
  const pair = autoBilingualName(name);
  const mr = isDevanagari(name) ? name.trim() : pair.mr || name.trim();
  const en = nameEn?.trim() || (isDevanagari(name) ? pair.en || name.trim() : name.trim());
  return { mr, en };
}

function failure(err: unknown): Result {
  return { success: false, error: err instanceof ApiError ? err.message : "Something went wrong" };
}

function report(err: unknown) {
  if (typeof window !== "undefined") window.alert(failure(err).error);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("mr");
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [villages, setVillages] = useState<Village[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);

  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "mr" ? "en" : "mr"));
  };

  const loadVillages = useCallback(async (role: UserRole) => {
    const q = role === "SALESPERSON" ? "?assigned=true" : "";
    const { data } = await apiFetch<{ data: Parameters<typeof toVillage>[0][] }>(`/villages${q}`);
    const list = data.map(toVillage);
    setVillages(list);
    setSelectedVillage((prev) => (prev && list.find((v) => v.id === prev.id)) || list[0] || null);
  }, []);

  const loadShops = useCallback(async () => {
    const { data } = await apiFetch<{ data: Parameters<typeof toShop>[0][] }>(`/shops?pageSize=500`);
    setShops(data.map(toShop));
  }, []);

  const loadOrders = useCallback(async (role: UserRole) => {
    // Salespersons work with today's orders; admins see the latest orders across all days.
    const q = role === "SALESPERSON" ? `?date=${todayIST()}&pageSize=500` : "?pageSize=500";
    const { data } = await apiFetch<{ data: Parameters<typeof toOrder>[0][] }>(`/orders${q}`);
    setOrders(data.map(toOrder));
  }, []);

  const loadSalespersons = useCallback(async () => {
    const { data } = await apiFetch<{ data: Parameters<typeof toSalesperson>[0][] }>(`/salespersons`);
    setSalespersons(data.map(toSalesperson));
  }, []);

  const loadAll = useCallback(
    async (role: UserRole) => {
      await Promise.all([
        loadVillages(role),
        loadShops(),
        loadOrders(role),
        role === "ADMIN" ? loadSalespersons() : Promise.resolve(setSalespersons([])),
      ]);
    },
    [loadVillages, loadShops, loadOrders, loadSalespersons],
  );

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setVillages([]);
    setShops([]);
    setOrders([]);
    setSalespersons([]);
    setSelectedVillage(null);
    setSelectedShop(null);
  }, []);

  const startSession = useCallback(
    async (user: CurrentUser) => {
      setCurrentUser(user);
      setLoading(true);
      try {
        await loadAll(user.role);
      } finally {
        setLoading(false);
      }
    },
    [loadAll],
  );

  // Restore the session from a saved token.
  useEffect(() => {
    if (!getAuthToken()) {
      setAuthReady(true);
      return;
    }
    apiFetch<{ user: ApiUser }>("/auth/me")
      .then(({ user }) => {
        const u = toCurrentUser(user);
        setLanguage(u.role === "ADMIN" ? "en" : "mr");
        return startSession(u);
      })
      .catch(() => clearSession())
      .finally(() => setAuthReady(true));
  }, [startSession, clearSession]);

  const refresh = useCallback(async () => {
    if (currentUser) await loadAll(currentUser.role);
  }, [currentUser, loadAll]);

  const login = async (email: string, pass: string) => {
    try {
      const { token, user } = await apiFetch<{ token: string; user: ApiUser }>("/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password: pass },
      });
      setAuthToken(token);
      const u = toCurrentUser(user);
      setLanguage(u.role === "ADMIN" ? "en" : "mr");
      await startSession(u);
      return { success: true, role: u.role };
    } catch (err) {
      return { ...failure(err), error: err instanceof ApiError ? err.code : "ERROR" };
    }
  };

  const registerSalesperson = async ({ name, nameEn, email, mobile, password }: {
    name: string;
    nameEn?: string;
    email: string;
    mobile: string;
    password: string;
  }) => {
    const { mr, en } = bilingual(name, nameEn);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { name: mr, nameEn: en, email: email.trim().toLowerCase(), mobile: mobile.trim(), password },
      });
      return { success: true, pendingApproval: true };
    } catch (err) {
      return failure(err);
    }
  };

  const logout = () => {
    clearSession();
  };

  /** Runs a mutation, then reloads what it affects; errors are shown and returned. */
  const mutate = async (fn: () => Promise<unknown>, reload: () => Promise<unknown>): Promise<Result> => {
    try {
      await fn();
    } catch (err) {
      report(err);
      return failure(err);
    }
    await reload().catch(() => undefined);
    return { success: true };
  };

  const role = currentUser?.role ?? "SALESPERSON";

  const addSalesperson: AppContextType["addSalesperson"] = async ({
    name,
    nameEn,
    email,
    password,
    mobile,
    assignedVillages = [],
    status = "ACTIVE",
  }) => {
    const { mr, en } = bilingual(name, nameEn);
    try {
      const { data } = await apiFetch<{ data: Parameters<typeof toSalesperson>[0] }>("/salespersons", {
        method: "POST",
        body: { name: mr, nameEn: en, email, password, mobile, status, assignedVillageIds: assignedVillages },
      });
      await Promise.all([loadSalespersons(), loadVillages(role)]);
      return toSalesperson(data);
    } catch (err) {
      report(err);
      throw err;
    }
  };

  const updateSalesperson = (salespersonId: string, d: Partial<Salesperson>) =>
    mutate(
      () =>
        apiFetch(`/salespersons/${salespersonId}`, {
          method: "PATCH",
          body: {
            name: d.name,
            nameEn: d.nameEn,
            email: d.email,
            mobile: d.mobile || undefined,
            status: d.status,
            assignedVillageIds: d.assignedVillages,
          },
        }),
      loadSalespersons,
    );

  const toggleSalespersonStatus = (salespersonId: string) => {
    const sp = salespersons.find((s) => s.id === salespersonId);
    return mutate(
      () =>
        apiFetch(`/salespersons/${salespersonId}/status`, {
          method: "PATCH",
          body: { status: sp?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
        }),
      loadSalespersons,
    );
  };

  const resetSalespersonPassword = (salespersonId: string, newPass: string) =>
    mutate(
      () => apiFetch(`/salespersons/${salespersonId}/reset-password`, { method: "POST", body: { newPassword: newPass } }),
      async () => undefined,
    );

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiFetch("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const deleteSalesperson = (salespersonId: string) =>
    mutate(() => apiFetch(`/salespersons/${salespersonId}`, { method: "DELETE" }), loadSalespersons);

  const addShop = async (shopData: Omit<Shop, "id">) => {
    try {
      const { data } = await apiFetch<{ data: Parameters<typeof toShop>[0] }>("/shops", {
        method: "POST",
        body: fromShop(shopData),
      });
      await Promise.all([loadShops(), loadVillages(role)]);
      return toShop(data);
    } catch (err) {
      report(err);
      throw err;
    }
  };

  const updateShop = (shopId: string, updatedData: Partial<Shop>) =>
    mutate(
      () => apiFetch(`/shops/${shopId}`, { method: "PATCH", body: fromShop(updatedData) }),
      () => Promise.all([loadShops(), loadVillages(role)]),
    );

  const deleteShop = (shopId: string) =>
    mutate(
      () => apiFetch(`/shops/${shopId}`, { method: "DELETE" }),
      () => Promise.all([loadShops(), loadVillages(role)]),
    );

  const addVillage = async (villageData: { marathiName: string; englishName: string; taluka: string; district: string }) => {
    try {
      const { data } = await apiFetch<{ data: Parameters<typeof toVillage>[0] }>("/villages", {
        method: "POST",
        body: villageData,
      });
      await loadVillages(role);
      return toVillage(data);
    } catch (err) {
      report(err);
      throw err;
    }
  };

  const updateVillage = (villageId: string, d: Partial<Village>) =>
    mutate(
      () =>
        apiFetch(`/villages/${villageId}`, {
          method: "PATCH",
          body: { marathiName: d.marathiName, englishName: d.englishName, taluka: d.taluka, district: d.district, status: d.status },
        }),
      () => loadVillages(role),
    );

  const deleteVillage = (villageId: string) =>
    mutate(
      () => apiFetch(`/villages/${villageId}`, { method: "DELETE" }),
      () => Promise.all([loadVillages(role), loadShops()]),
    );

  const createOrder: AppContextType["createOrder"] = async ({ shopId, transcribedText, items }) => {
    const { data } = await apiFetch<{ data: Parameters<typeof toOrder>[0] }>("/orders", {
      method: "POST",
      body: { shopId, transcribedText, items: items.map(fromOrderItem) },
    });
    const created = toOrder(data);
    setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
    loadVillages(role).catch(() => undefined);
    return created;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        authReady,
        loading,
        currentUser,
        login,
        registerSalesperson,
        logout,
        refresh,
        villages,
        shops,
        orders,
        salespersons,
        selectedVillage,
        setSelectedVillage,
        selectedShop,
        setSelectedShop,
        addShop,
        updateShop,
        deleteShop,
        addVillage,
        updateVillage,
        deleteVillage,
        addSalesperson,
        updateSalesperson,
        deleteSalesperson,
        toggleSalespersonStatus,
        changePassword,
        resetSalespersonPassword,
        createOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
