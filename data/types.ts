/** Shapes the UI works with; lib/api.ts maps API responses into them. */

export interface Salesperson {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  mobile: string;
  status: 'ACTIVE' | 'INACTIVE';
  todayVisits: number;
  todayOrders: number;
  assignedVillages: string[];
}

export interface Village {
  id: string;
  marathiName: string;
  englishName: string;
  taluka: string;
  district: string;
  status?: 'ACTIVE' | 'INACTIVE';
  shopsCount: number;
  visitsToday: number;
  ordersToday: number;
}

export interface Shop {
  id: string;
  name: string;
  nameEn: string;
  owner: string;
  ownerEn: string;
  mobile: string;
  villageId: string;
  address: string;
  addressEn: string;
  outstandingBalance: number;
}

/** `name` and `unit` are shown as "मराठी (English)" when an English label is known. */
export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  /** Item Master entry for this line ("PARLE G RS 10"), when one was matched or picked. */
  itemId?: string;
  itemName?: string;
  itemUnit?: string;
  /** The salesperson chose the item by hand; the server learns the spoken name as an alias. */
  itemPicked?: boolean;
}

/** One product of the Item Master (admin → आयटम मास्टर). */
export interface MasterItem {
  id: string;
  name: string;
  marathiName: string | null;
  aliases: string[];
  unit: string;
  packType: string;
  packQty: number | null;
  freeQty: number | null;
  price: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

/** An Item Master candidate for a spoken product name, best first. */
export interface ItemSuggestion {
  id: string;
  name: string;
  marathiName: string | null;
  unit: string;
  price: number | null;
  /** 0–1: how closely the spoken words match the item. */
  score: number;
}

export interface Order {
  id: string;
  /** Human-readable order number, e.g. ORD-101. */
  displayId: string;
  salespersonId: string;
  villageId: string;
  shopId: string;
  transcribedText: string;
  items: OrderItem[];
  status: 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  /** Formatted for display (en-IN). */
  createdAt: string;
  createdAtIso: string;
}
