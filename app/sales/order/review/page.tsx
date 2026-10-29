"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DataGate } from "@/components/common/DataGate";
import { apiFetch, ApiError, ApiOrderItem, toOrderItem } from "@/lib/api";
import { translations } from "@/data/translations";
import { OrderItem } from "@/data/types";
import { BilingualName } from "@/components/common/BilingualName";
import {
  CheckCircle2,
  Edit2,
  RefreshCw,
  Store,
  MapPin,
  Check,
  Plus,
  Trash2,
  Package,
} from "lucide-react";

type ReviewItem = OrderItem & { isNew?: boolean };

function OrderReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, shops, villages, selectedShop, createOrder } = useApp();
  const t = translations[language];

  const shopParam = searchParams.get("shop");
  const currentShop = shops.find((s) => s.id === shopParam) || selectedShop || shops[0];
  const currentVillage = villages.find((v) => v.id === currentShop.villageId) || villages[0];

  const [orderText, setOrderText] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  /** Reads the line items out of the spoken text with the server's Marathi order parser. */
  const parseText = async (text: string) => {
    if (!text.trim()) {
      setItems([]);
      return;
    }
    setIsParsing(true);
    setError("");
    try {
      const { data } = await apiFetch<{ data: { items: ApiOrderItem[] } }>("/voice/parse", {
        method: "POST",
        body: { text },
      });
      setItems(data.items.map(toOrderItem));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not read the order text");
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    const savedText = sessionStorage.getItem("current_order_text") || "";
    setOrderText(savedText);
    parseText(savedText);
  }, []);

  const handleToggleEditText = () => {
    if (isEditingText) parseText(orderText);
    setIsEditingText(!isEditingText);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    setItems((prev) => [...prev, { name: "", quantity: 1, unit: "किलो (kg)", isNew: true }]);
  };

  const handleItemFieldChange = (index: number, field: "name" | "unit", value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSaveOrder = async () => {
    const finalItems = items
      .filter((i) => i.name.trim() && i.unit.trim())
      .map(({ name, quantity, unit }) => ({ name: name.trim(), quantity, unit: unit.trim() }));
    if (!finalItems.length) {
      setError(language === "mr" ? "किमान एक वस्तू जोडा." : "Add at least one item.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const created = await createOrder({
        shopId: currentShop.id,
        villageId: currentVillage.id,
        transcribedText: orderText.trim(),
        items: finalItems,
      });
      sessionStorage.setItem("last_created_order_id", created.id);
      sessionStorage.removeItem("current_order_text");
      router.push(`/sales/order/success?orderId=${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the order");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Current Shop Banner */}
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
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {language === "mr" ? "गाव" : "Village"}:{" "}
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
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-brand-primary text-xs font-bold mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t.recordingFinished}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          {t.reviewOrderTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {t.reviewSubtitle}
        </p>
      </div>

      {/* Spoken Text Card with Edit Button */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-brand-primary" />
            <span>{t.transcribedSpeechText}</span>
          </span>

          <button
            type="button"
            onClick={handleToggleEditText}
            className="text-xs font-bold text-brand-primary hover:text-brand-deep flex items-center gap-1 p-1 rounded-lg hover:bg-emerald-50 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingText ? t.save : t.edit}</span>
          </button>
        </div>

        {isEditingText ? (
          <textarea
            rows={3}
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
            className="w-full p-3 rounded-2xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-sm font-semibold text-slate-800 bg-emerald-50/20"
          />
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-slate-900 text-base font-bold leading-relaxed">
            {orderText}
          </div>
        )}
      </section>

      {/* Itemized Products Breakdown */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t.detectedItems}
            </h3>
            <span className="text-xs text-slate-400">
              {language === "mr" ? "प्रमाण व नग तपासा" : "Review product quantities and units"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddNewItem}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addItem}</span>
          </button>
        </div>

        {isParsing && (
          <p className="text-xs text-slate-400">{language === "mr" ? "ऑर्डर वाचत आहे..." : "Reading the order..."}</p>
        )}
        {!isParsing && items.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            {language === "mr"
              ? "मजकुरातून वस्तू वाचता आल्या नाहीत. मजकूर दुरुस्त करा किंवा वस्तू जोडा."
              : "No items could be read from the text. Edit the text or add items."}
          </p>
        )}

        <div className="divide-y divide-slate-100">
          {items.map((item, idx) => {
            const nameMatch = item.name.match(/^(.*?)\s*\((.*?)\)$/);
            const unitMatch = item.unit.match(/^(.*?)\s*\((.*?)\)$/);

            return (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                {item.isNew ? (
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                    placeholder={language === "mr" ? "वस्तूचे नाव" : "Item name"}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleItemFieldChange(idx, "unit", e.target.value)}
                    placeholder={language === "mr" ? "नग / किलो" : "Unit"}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                ) : (
                <div className="flex-1">
                  <span className="text-sm sm:text-base font-bold text-slate-900 block leading-tight">
                    {nameMatch ? (
                      <BilingualName
                        mr={nameMatch[1]}
                        en={nameMatch[2]}
                        secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                      />
                    ) : (
                      item.name
                    )}
                  </span>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">
                    {unitMatch ? (
                      <BilingualName
                        mr={unitMatch[1]}
                        en={unitMatch[2]}
                        secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                      />
                    ) : (
                      item.unit
                    )}
                  </span>
                </div>
                )}

              {/* Quantity Counter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(idx, -1)}
                    className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black text-sm text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(idx, 1)}
                    className="w-7 h-7 rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-deep flex items-center justify-center transition"
                  >
                    +
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
          );
        })}
      </div>
      </section>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => router.push(`/sales/order/record?shop=${currentShop.id}`)}
          className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-brand-primary text-brand-primary hover:bg-emerald-50 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t.reRecord}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveOrder}
          disabled={isSaving || isParsing}
          className="disabled:opacity-60 flex-2 py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 active:scale-[0.99] transition"
        >
          <Check className="w-5 h-5" />
          <span>{t.saveOrder}</span>
        </button>
      </div>
    </div>
  );
}

function OrderReviewContentGate() {
  const { villages, shops } = useApp();
  return (
    <DataGate ready={shops.length > 0 && villages.length > 0} emptyMr="या गावात अजून दुकान नाही. आधी दुकान जोडा." emptyEn="No shops yet. Add a shop first." href="/sales/villages" linkMr="गाव निवडा" linkEn="Select village">
      <OrderReviewContent />
    </DataGate>
  );
}

export default function OrderReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <OrderReviewContentGate />
    </Suspense>
  );
}
