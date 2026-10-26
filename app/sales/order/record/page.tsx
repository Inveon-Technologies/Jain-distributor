"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import {
  Mic,
  Store,
  MapPin,
  ArrowRight,
  Square,
  Sparkles,
} from "lucide-react";

function RecordOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, shops, villages, selectedShop } = useApp();
  const t = translations[language];

  const shopParam = searchParams.get("shop");
  const currentShop = shops.find((s) => s.id === shopParam) || selectedShop || shops[0];
  const currentVillage = villages.find((v) => v.id === currentShop.villageId) || villages[0];

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState("");

  const sampleSpeech =
    "दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स.";

  // Timer effect when recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscribedText("");
      setTimeout(() => {
        setTranscribedText("दहा किलो रवा...");
      }, 1500);
      setTimeout(() => {
        setTranscribedText("दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट...");
      }, 3000);
      setTimeout(() => {
        setTranscribedText(sampleSpeech);
        setIsRecording(false);
      }, 4500);
    } else {
      setIsRecording(false);
      setTranscribedText(sampleSpeech);
    }
  };

  const handleProceed = () => {
    const textToPass = transcribedText || sampleSpeech;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("current_order_shop", currentShop.id);
      sessionStorage.setItem("current_order_text", textToPass);
    }
    router.push(`/sales/order/review?shop=${currentShop.id}`);
  };

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
      <div className="text-center py-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          {t.recordOrderTitle}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {t.speakClearly}
        </p>
      </div>

      {/* Mic Center Stage */}
      <div className="bg-gradient-to-b from-white via-white to-emerald-50/30 rounded-3xl p-6 sm:p-10 border border-emerald-100/80 shadow-sm flex flex-col items-center justify-center space-y-6">
        {/* Pulsing Mic Button */}
        <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60">
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-300/20 animate-ping duration-1000"></div>
              <div className="absolute inset-4 rounded-full bg-emerald-400/25 animate-pulse duration-700"></div>
            </>
          )}

          <button
            type="button"
            onClick={handleToggleRecording}
            className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${
              isRecording
                ? "bg-red-600 text-white ring-8 ring-red-200"
                : "bg-gradient-to-br from-brand-primary to-brand-deep text-white ring-8 ring-emerald-100 hover:shadow-2xl"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-12 h-12 text-white fill-white mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  {seconds}s • {language === "mr" ? "थांबवा" : "Stop"}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-14 h-14 text-white drop-shadow-md mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">
                  {language === "mr" ? "बोला" : "Speak"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition ${
              isRecording
                ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                : "bg-emerald-50 text-brand-primary border border-emerald-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRecording ? "bg-red-600" : "bg-emerald-600"
              }`}
            ></span>
            <span>{isRecording ? t.recordingActive : t.tapToSpeak}</span>
          </div>
        </div>

        {/* Transcribed Text Preview Box */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              <span>{t.transcribedSpeechText}</span>
            </span>
            {transcribedText && (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                {language === "mr" ? "मराठी व्हॉईस-टू-टेक्स्ट" : "Marathi Speech-to-Text"}
              </span>
            )}
          </div>

          <div
            className={`w-full min-h-[100px] p-4 rounded-2xl border text-sm sm:text-base font-semibold transition leading-relaxed ${
              transcribedText
                ? "bg-white border-emerald-300 text-slate-900 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            {transcribedText || t.orderTextPlaceholder}
          </div>
        </div>

        {/* Quick Demo Voice Fill Option */}
        {!transcribedText && !isRecording && (
          <button
            type="button"
            onClick={() => setTranscribedText(sampleSpeech)}
            className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>💡 {language === "mr" ? "नमुना ऑर्डर मजकूर भरा" : "Fill sample Marathi order text"}</span>
          </button>
        )}
      </div>

      {/* Footer Submit Button */}
      <button
        type="button"
        disabled={!transcribedText && !isRecording}
        onClick={handleProceed}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition ${
          transcribedText
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

export default function RecordOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">लोड होत आहे...</div>}>
      <RecordOrderContent />
    </Suspense>
  );
}
