"use client";

import React, { createContext, useContext, useState } from "react";
import { autoBilingualName, isDevanagari } from "@/utils/transliterate";
import {
  INITIAL_SALESPERSONS,
  INITIAL_VILLAGES,
  INITIAL_SHOPS,
  INITIAL_ORDERS,
  Salesperson,
  Village,
  Shop,
  Order,
  OrderItem,
} from "@/data/mockData";

export type Language = "mr" | "en";
export type UserRole = "SALESPERSON" | "ADMIN";

export interface CurrentUser {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  role: UserRole;
  mobile?: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  currentUser: CurrentUser | null;
  login: (email: string, pass: string) => { success: boolean; role?: UserRole; error?: string };
  registerSalesperson: (data: { name: string; nameEn?: string; email: string; mobile: string; password?: string }) => { success: boolean; pendingApproval?: boolean };
  logout: () => void;
  villages: Village[];
  shops: Shop[];
  orders: Order[];
  salespersons: Salesperson[];
  toggleSalespersonStatus: (salespersonId: string) => void;
  updateSalespersonPassword: (salespersonId: string, newPass: string) => { success: boolean };
  selectedVillage: Village | null;
  setSelectedVillage: (v: Village | null) => void;
  selectedShop: Shop | null;
  setSelectedShop: (s: Shop | null) => void;
  addShop: (newShop: Omit<Shop, "id">) => Shop;
  deleteShop: (shopId: string) => void;
  addVillage: (newVillage: { marathiName: string; englishName: string; taluka: string; district: string }) => Village;
  deleteVillage: (villageId: string) => void;
  addSalesperson: (data: {
    name: string;
    nameEn?: string;
    email: string;
    password?: string;
    mobile: string;
    assignedVillages?: string[];
    status?: "ACTIVE" | "INACTIVE";
  }) => Salesperson;
  deleteSalesperson: (salespersonId: string) => void;
  createOrder: (orderData: {
    shopId: string;
    villageId: string;
    transcribedText: string;
    items: OrderItem[];
  }) => Order;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("mr");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>({
    id: "sp-1",
    name: "अमोल पाटील",
    nameEn: "Amol Patil",
    email: "amol@jain.com",
    role: "SALESPERSON",
    mobile: "+91 98220 12345",
  });

  const [villages, setVillages] = useState<Village[]>(INITIAL_VILLAGES);
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [salespersons, setSalespersons] = useState<Salesperson[]>(INITIAL_SALESPERSONS);

  const [selectedVillage, setSelectedVillage] = useState<Village | null>(INITIAL_VILLAGES[0]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(INITIAL_SHOPS[0]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "mr" ? "en" : "mr"));
  };

  const login = (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.includes("admin")) {
      const adminUser: CurrentUser = {
        id: "admin-1",
        name: "प्रशासक (Administrator)",
        nameEn: "Administrator",
        email: cleanEmail,
        role: "ADMIN",
      };
      setCurrentUser(adminUser);
      setLanguage("en");
      return { success: true, role: "ADMIN" as UserRole };
    } else {
      const sp = salespersons.find((s) => s.email.toLowerCase() === cleanEmail);
      if (!sp) {
        // Fallback for default demo
        const fallback = salespersons[0];
        if (fallback.status === "INACTIVE") {
          return { success: false, error: "ACCOUNT_INACTIVE" };
        }
        setCurrentUser({
          id: fallback.id,
          name: fallback.name,
          nameEn: fallback.nameEn,
          email: cleanEmail || fallback.email,
          role: "SALESPERSON",
          mobile: fallback.mobile,
        });
        setLanguage("mr");
        return { success: true, role: "SALESPERSON" as UserRole };
      }

      // Check if user is INACTIVE (pending admin approval)
      if (sp.status === "INACTIVE") {
        return { success: false, error: "ACCOUNT_INACTIVE" };
      }

      // Check password if set
      if (sp.password && pass && sp.password !== pass) {
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      const salesUser: CurrentUser = {
        id: sp.id,
        name: sp.name,
        nameEn: sp.nameEn,
        email: cleanEmail,
        role: "SALESPERSON",
        mobile: sp.mobile,
      };
      setCurrentUser(salesUser);
      setLanguage("mr");
      return { success: true, role: "SALESPERSON" as UserRole };
    }
  };

  const registerSalesperson = ({
    name,
    nameEn,
    email,
    mobile,
    password = "123456",
  }: {
    name: string;
    nameEn?: string;
    email: string;
    mobile: string;
    password?: string;
  }) => {
    const id = `sp-${salespersons.length + 1}`;
    const bilingual = autoBilingualName(name);
    const finalMr = isDevanagari(name) ? name.trim() : (bilingual.mr || name.trim());
    const finalEn = nameEn?.trim() || (isDevanagari(name) ? (bilingual.en || name.trim()) : name.trim());
    const newSp: Salesperson = {
      id,
      name: finalMr,
      nameEn: finalEn,
      email: email.trim().toLowerCase(),
      password,
      mobile: mobile || "+91 98000 00000",
      status: "INACTIVE", // Self-registration starts as INACTIVE (Pending Admin Approval)
      todayVisits: 0,
      todayOrders: 0,
      assignedVillages: ["v-1"],
    };

    setSalespersons((prev) => [...prev, newSp]);
    return { success: true, pendingApproval: true };
  };

  const addSalesperson = ({
    name,
    nameEn,
    email,
    password = "123456",
    mobile,
    assignedVillages = ["v-1"],
    status = "ACTIVE",
  }: {
    name: string;
    nameEn?: string;
    email: string;
    password?: string;
    mobile: string;
    assignedVillages?: string[];
    status?: "ACTIVE" | "INACTIVE";
  }) => {
    const id = `sp-${salespersons.length + 1}`;
    const bilingual = autoBilingualName(name);
    const finalMr = isDevanagari(name) ? name.trim() : (bilingual.mr || name.trim());
    const finalEn = nameEn?.trim() || (isDevanagari(name) ? (bilingual.en || name.trim()) : name.trim());

    const created: Salesperson = {
      id,
      name: finalMr,
      nameEn: finalEn,
      email: email.trim().toLowerCase(),
      password,
      mobile: mobile || "+91 98000 00000",
      status,
      todayVisits: 0,
      todayOrders: 0,
      assignedVillages,
    };

    setSalespersons((prev) => [...prev, created]);
    return created;
  };

  const toggleSalespersonStatus = (salespersonId: string) => {
    setSalespersons((prev) =>
      prev.map((sp) =>
        sp.id === salespersonId
          ? { ...sp, status: sp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
          : sp
      )
    );
  };

  const updateSalespersonPassword = (salespersonId: string, newPass: string) => {
    setSalespersons((prev) =>
      prev.map((sp) => (sp.id === salespersonId ? { ...sp, password: newPass } : sp))
    );
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addShop = (shopData: Omit<Shop, "id">) => {
    const id = `s-${shops.length + 1}`;
    const created: Shop = { ...shopData, id };
    setShops((prev) => [created, ...prev]);

    setVillages((prev) =>
      prev.map((v) =>
        v.id === shopData.villageId ? { ...v, shopsCount: v.shopsCount + 1 } : v
      )
    );
    return created;
  };

  const deleteShop = (shopId: string) => {
    const targetShop = shops.find((s) => s.id === shopId);
    setShops((prev) => prev.filter((s) => s.id !== shopId));
    if (targetShop) {
      setVillages((prev) =>
        prev.map((v) =>
          v.id === targetShop.villageId
            ? { ...v, shopsCount: Math.max(0, v.shopsCount - 1) }
            : v
        )
      );
    }
  };

  const addVillage = (villageData: { marathiName: string; englishName: string; taluka: string; district: string }) => {
    const id = `v-${villages.length + 1}`;
    const created: Village = {
      ...villageData,
      id,
      shopsCount: 0,
      visitsToday: 0,
      ordersToday: 0,
    };
    setVillages((prev) => [...prev, created]);
    return created;
  };

  const deleteVillage = (villageId: string) => {
    setVillages((prev) => prev.filter((v) => v.id !== villageId));
    setShops((prev) => prev.filter((s) => s.villageId !== villageId));
  };

  const deleteSalesperson = (salespersonId: string) => {
    setSalespersons((prev) => prev.filter((sp) => sp.id !== salespersonId));
  };

  const createOrder = ({
    shopId,
    villageId,
    transcribedText,
    items,
  }: {
    shopId: string;
    villageId: string;
    transcribedText: string;
    items: OrderItem[];
  }) => {
    const id = `ORD-${orders.length + 101}`;
    const now = new Date();
    const timeStr = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newOrder: Order = {
      id,
      salespersonId: currentUser?.id || "sp-1",
      villageId,
      shopId,
      transcribedText,
      items,
      status: "CONFIRMED",
      createdAt: timeStr,
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (currentUser?.id) {
      setSalespersons((prev) =>
        prev.map((sp) =>
          sp.id === currentUser.id ? { ...sp, todayOrders: sp.todayOrders + 1 } : sp
        )
      );
    }

    setVillages((prev) =>
      prev.map((v) =>
        v.id === villageId ? { ...v, ordersToday: v.ordersToday + 1 } : v
      )
    );

    return newOrder;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        currentUser,
        login,
        registerSalesperson,
        logout,
        villages,
        shops,
        orders,
        salespersons,
        selectedVillage,
        setSelectedVillage,
        selectedShop,
        setSelectedShop,
        addShop,
        deleteShop,
        addVillage,
        deleteVillage,
        addSalesperson,
        deleteSalesperson,
        toggleSalespersonStatus,
        updateSalespersonPassword,
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
