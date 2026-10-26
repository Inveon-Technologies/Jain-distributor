"use client";

import React, { createContext, useContext, useState } from "react";
import { autoBilingualName } from "@/utils/transliterate";
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
  registerSalesperson: (data: { name: string; email: string; mobile: string }) => { success: boolean };
  logout: () => void;
  villages: Village[];
  shops: Shop[];
  orders: Order[];
  salespersons: Salesperson[];
  selectedVillage: Village | null;
  setSelectedVillage: (v: Village | null) => void;
  selectedShop: Shop | null;
  setSelectedShop: (s: Shop | null) => void;
  addShop: (newShop: Omit<Shop, "id">) => Shop;
  addVillage: (newVillage: { marathiName: string; englishName: string; taluka: string; district: string }) => Village;
  addSalesperson: (data: {
    name: string;
    nameEn?: string;
    email: string;
    mobile: string;
    assignedVillages?: string[];
    status?: "ACTIVE" | "INACTIVE";
  }) => Salesperson;
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
      const sp = salespersons.find((s) => s.email.toLowerCase() === cleanEmail) || salespersons[0];
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

  const registerSalesperson = ({ name, email, mobile }: { name: string; email: string; mobile: string }) => {
    const id = `sp-${salespersons.length + 1}`;
    const bilingual = autoBilingualName(name);
    const newSp: Salesperson = {
      id,
      name: bilingual.mr || name,
      nameEn: bilingual.en || name,
      email,
      mobile: mobile || "+91 98000 00000",
      status: "ACTIVE",
      todayVisits: 0,
      todayOrders: 0,
      assignedVillages: ["v-1", "v-2"],
    };

    setSalespersons((prev) => [...prev, newSp]);
    setCurrentUser({
      id: newSp.id,
      name: newSp.name,
      nameEn: newSp.nameEn,
      email: newSp.email,
      role: "SALESPERSON",
      mobile: newSp.mobile,
    });
    setLanguage("mr");
    return { success: true };
  };

  const addSalesperson = ({
    name,
    nameEn,
    email,
    mobile,
    assignedVillages = ["v-1"],
    status = "ACTIVE",
  }: {
    name: string;
    nameEn?: string;
    email: string;
    mobile: string;
    assignedVillages?: string[];
    status?: "ACTIVE" | "INACTIVE";
  }) => {
    const id = `sp-${salespersons.length + 1}`;
    const bilingual = autoBilingualName(name);
    const finalMr = bilingual.mr || name;
    const finalEn = nameEn || bilingual.en || name;

    const created: Salesperson = {
      id,
      name: finalMr,
      nameEn: finalEn,
      email: email.trim().toLowerCase(),
      mobile: mobile || "+91 98000 00000",
      status,
      todayVisits: 0,
      todayOrders: 0,
      assignedVillages,
    };

    setSalespersons((prev) => [...prev, created]);
    return created;
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
        addVillage,
        addSalesperson,
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
