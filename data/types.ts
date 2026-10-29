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
