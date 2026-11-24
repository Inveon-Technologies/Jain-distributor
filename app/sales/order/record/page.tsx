"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DataGate } from "@/components/common/DataGate";
import { translations } from "@/data/translations";
import { BilingualName } from "@/components/common/BilingualName";
import { apiFetch } from "@/lib/api";
import {
  Store,
  MapPin,
  ArrowRight,
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  X,
} from "lucide-react";

interface ItemSuggestion {
  id: string;
  name: string;
  marathiName?: string;
  unit: string;
  score?: number;
}

interface CartItem {
  itemId: string;
  name: string;
  marathiName?: string;
  unit: string;
  quantity: number;
}

function RecordOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, shops, villages, selectedShop } = useApp();
  const t = translations[language];

  const shopParam = searchParams.get("shop");
  const currentShop = shops.find((s) => s.id === shopParam) || selectedShop || shops[0];
  const currentVillage = villages.find((v) => v.id === currentShop.villageId) || villages[0];

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with 300ms debounce
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsFetching(true);
      try {
        const res = await apiFetch<{ data: ItemSuggestion[] }>(
          `/items/suggest?q=${encodeURIComponent(q)}&limit=8`
        );
        setSuggestions(res.data ?? []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsFetching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectItem = (item: ItemSuggestion) => {
    setCart((prev) => {
      const existing = prev.findIndex((c) => c.itemId === item.id);
      if (existing >= 0) {
        // Already in cart: bump quantity
        return prev.map((c, i) =>
          i === existing ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          marathiName: item.marathiName,
          unit: item.unit,
          quantity: 1,
        },
      ];
    });
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProceed = () => {
    if (cart.length === 0) return;

    // Build a simple text representation for the review page's /items/parse fallback
    const orderText = cart
      .map((item) => {
        const displayName = item.marathiName || item.name;
        return `${displayName} ${item.quantity} ${item.unit}`;
      })
      .join("\n");

    if (typeof window !== "undefined") {
      sessionStorage.setItem("current_order_shop", currentShop.id);
      sessionStorage.setItem("current_order_text", orderText);
      // Store structured items so the review page can skip re-parsing
      sessionStorage.setItem("current_order_items", JSON.stringify(cart));
    }

    router.push(`/sales/order/review?shop=${currentShop.id}`);
  };

  const mr = language === "mr";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Shop Context Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              <BilingualName
                mr={currentShop.name}
                en={currentShop.nameEn}
                secondaryClassName="text-xs sm:text-sm font-normal text-slate-500 ml-1.5"
              />
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {mr ? "गाव" : "Village"}:{" "}
                <BilingualName
                  mr={currentVillage.marathiName}
                  en={currentVillage.englishName}
                  className="font-bold text-slate-700"
                  secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                />
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/sales/shops?village=${currentVillage.id}`)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition shrink-0"
        >
          {t.switchShop}
        </button>
      </section>

      {/* Screen Title */}
      <div className="text-center py-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          {mr ? "ऑर्डर नोंदवा" : "Record Order"}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {mr ? "वस्तू शोधा आणि यादीत जोडा" : "Search items and add them to the list"}
        </p>
      </div>

      {/* Search + Autocomplete */}
      <div ref={searchRef} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          {isFetching && (
            <div className="absolute right-4 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          )}
          {query && !isFetching && (
            <button
              type="button"
              onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); }}
              className="absolute right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={mr ? "वस्तू शोधा: पार्ले, साखर, चहा..." : "Search items: parle, sugar, tea..."}
            className="w-full pl-11 pr-11 py-4 rounded-2xl border border-slate-200 bg-white shadow-xs text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition"
            autoComplete="off"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectItem(item); }}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition flex items-center justify-between gap-3 border-b border-slate-100 last:border-0"
                >
                  <div className="min-w-0">
                    <span className="block font-bold text-slate-900 text-sm truncate">
                      {item.marathiName || item.name}
                    </span>
                    {item.marathiName && (
                      <span className="block text-xs text-slate-500 truncate">{item.name}</span>
                    )}
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0">
                    {item.unit}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {showDropdown && query.trim() && !isFetching && suggestions.length === 0 && (
          <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl px-4 py-3 text-sm text-slate-500 font-medium">
            {mr ? "कोणतेही आयटम सापडले नाहीत." : "No items found."}
          </div>
        )}
      </div>

      {/* Cart */}
      {cart.length > 0 ? (
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-bold text-slate-900">
                {mr ? "निवडलेल्या वस्तू" : "Selected Items"}
              </h3>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                {cart.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {cart.map((item, idx) => (
              <div key={item.itemId} className="px-5 py-3.5 flex items-center justify-between gap-3">
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-slate-900 text-sm leading-tight truncate">
                    {item.marathiName || item.name}
                  </span>
                  {item.marathiName && (
                    <span className="block text-xs text-slate-400 truncate">{item.name}</span>
                  )}
                  <span className="inline-block text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5">
                    {item.unit}
                  </span>
                </div>

                {/* Quantity controls + remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(idx, -1)}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-black text-sm text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(idx, 1)}
                      className="w-7 h-7 rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-deep flex items-center justify-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl py-14 flex flex-col items-center justify-center gap-3 text-slate-400">
          <ShoppingCart className="w-10 h-10 opacity-30" />
          <p className="text-sm font-semibold">
            {mr ? "अजून कोणतीही वस्तू जोडली नाही" : "No items added yet"}
          </p>
          <p className="text-xs font-medium text-slate-400">
            {mr ? "वर वस्तू शोधून यादीत जोडा" : "Search for items above and add them to the list"}
          </p>
        </div>
      )}

      {/* Footer Submit Button */}
      <button
        type="button"
        disabled={cart.length === 0}
        onClick={handleProceed}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition ${
          cart.length > 0
            ? "bg-brand-primary hover:bg-brand-deep text-white shadow-brand-primary/25 cursor-pointer active:scale-[0.99]"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        <span>{t.proceedToReview}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function RecordOrderContentGate() {
  const { villages, shops } = useApp();
  return (
    <DataGate
      ready={shops.length > 0 && villages.length > 0}
      emptyMr="अजून दुकान नाही. आधी दुकान जोडा."
      emptyEn="No shops yet. Add a shop first."
      href="/sales/villages"
      linkMr="गाव निवडा"
      linkEn="Select village"
    >
      <RecordOrderContent />
    </DataGate>
  );
}

export default function RecordOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <RecordOrderContentGate />
    </Suspense>
  );
}
