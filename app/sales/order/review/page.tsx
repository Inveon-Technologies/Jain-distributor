"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { OrderItem } from "@/data/mockData";
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

function OrderReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, shops, villages, selectedShop, createOrder } = useApp();
  const t = translations[language];

  const shopParam = searchParams.get("shop");
  const currentShop = shops.find((s) => s.id === shopParam) || selectedShop || shops[0];
  const currentVillage = villages.find((v) => v.id === currentShop.villageId) || villages[0];

  const [orderText, setOrderText] = useState(
    "दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स."
  );
  const [isEditingText, setIsEditingText] = useState(false);

  const [items, setItems] = useState<OrderItem[]>([
    { name: "रवा (Rava)", quantity: 10, unit: "किलो (kg)" },
    { name: "पार्ले बिस्किट (Parle Biscuit)", quantity: 20, unit: "पॅकेट (Packet)" },
    { name: "गूळ (Jaggery)", quantity: 50, unit: "किलो (kg)" },
    { name: "डाबर टूथपेस्ट (Dabur Toothpaste)", quantity: 5, unit: "बॉक्स (Box)" },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedText = sessionStorage.getItem("current_order_text");
      if (savedText) {
        setOrderText(savedText);
      }
    }
  }, []);

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
    setItems((prev) => [
      ...prev,
      { name: "साखर (Sugar)", quantity: 10, unit: "किलो (kg)" },
    ]);
  };

  const handleSaveOrder = () => {
    const created = createOrder({
      shopId: currentShop.id,
      villageId: currentVillage.id,
      transcribedText: orderText,
      items,
    });

    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_created_order_id", created.id);
    }

    router.push(`/sales/order/success?orderId=${created.id}`);
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
              {currentShop.name}
            </h2>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {language === "mr" ? "गाव" : "Village"}:{" "}
                <strong className="text-slate-700">{currentVillage.marathiName}</strong>
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
            onClick={() => setIsEditingText(!isEditingText)}
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

        <div className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-sm sm:text-base font-bold text-slate-900 block leading-tight">
                  {item.name}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {item.unit}
                </span>
              </div>

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
          ))}
        </div>
      </section>

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
          className="flex-2 py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 active:scale-[0.99] transition"
        >
          <Check className="w-5 h-5" />
          <span>{t.saveOrder}</span>
        </button>
      </div>
    </div>
  );
}

export default function OrderReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <OrderReviewContent />
    </Suspense>
  );
}
