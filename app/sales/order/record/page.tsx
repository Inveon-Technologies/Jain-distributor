"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DataGate } from "@/components/common/DataGate";
import { translations } from "@/data/translations";
import { BilingualName } from "@/components/common/BilingualName";
import {
  Mic,
  Store,
  MapPin,
  ArrowRight,
  Square,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  MAX_RECORDING_SECONDS,
  RecorderError,
  startRecording,
  type RecorderHandle,
} from "@/lib/voice/recorder";
import { TranscribeError, transcribeRecording, type TranscribeResult } from "@/lib/voice/transcribe";

/** Bilingual messages for recording and recognition problems. */
const ERRORS: Record<string, { mr: string; en: string }> = {
  PERMISSION_DENIED: {
    mr: "माइक वापरण्याची परवानगी द्या (ब्राउझर सेटिंग्ज) आणि पुन्हा प्रयत्न करा.",
    en: "Allow microphone access in the browser settings and try again.",
  },
  NO_MIC: { mr: "फोनमध्ये माइक सापडला नाही.", en: "No microphone was found on this device." },
  UNSUPPORTED: {
    mr: "हा ब्राउझर रेकॉर्डिंग करू शकत नाही. Chrome मध्ये उघडा.",
    en: "This browser cannot record audio. Please open the app in Chrome.",
  },
  NO_SPEECH: {
    mr: "आवाज ऐकू आला नाही. फोन तोंडाजवळ धरा आणि पुन्हा स्पष्ट बोला.",
    en: "No speech was heard. Hold the phone closer and speak again clearly.",
  },
  STT_NOT_CONFIGURED: {
    mr: "व्हॉईस ओळख सर्व्हरवर अजून सुरू केलेली नाही. तोपर्यंत ऑर्डर खाली टाइप करा.",
    en: "Voice recognition is not set up on the server yet. Please type the order below for now.",
  },
  STT_FAILED: {
    mr: "व्हॉईस सेवा आत्ता उपलब्ध नाही. पुन्हा प्रयत्न करा किंवा ऑर्डर टाइप करा.",
    en: "Speech service is unavailable right now. Try again or type the order.",
  },
};

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [level, setLevel] = useState(0);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const recorderRef = useRef<RecorderHandle | null>(null);

  // Release the microphone if the salesperson leaves the screen mid-recording.
  useEffect(() => () => recorderRef.current?.cancel(), []);

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

  const stopAndTranscribe = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    setIsRecording(false);
    setLevel(0);
    setIsProcessing(true);
    try {
      const recording = await recorder.stop();
      const data = await transcribeRecording(recording);
      setResult(data);
      setTranscribedText(data.text);
    } catch (err) {
      if (err instanceof RecorderError) setErrorCode(err.code);
      else if (err instanceof TranscribeError && (err.code === "NO_SPEECH" || err.code === "STT_NOT_CONFIGURED"))
        setErrorCode(err.code);
      else setErrorCode("STT_FAILED");
    } finally {
      setIsProcessing(false);
    }
  };

  // Google's synchronous recognition is limited to about a minute; stop automatically before that.
  useEffect(() => {
    if (isRecording && seconds >= MAX_RECORDING_SECONDS) void stopAndTranscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, seconds]);

  const handleToggleRecording = async () => {
    if (isProcessing) return;
    if (isRecording) {
      await stopAndTranscribe();
      return;
    }
    setErrorCode(null);
    setResult(null);
    setTranscribedText("");
    try {
      recorderRef.current = await startRecording(setLevel);
      setIsRecording(true);
    } catch (err) {
      setErrorCode(err instanceof RecorderError ? err.code : "NO_MIC");
    }
  };

  const handleProceed = () => {
    const textToPass = transcribedText.trim();
    if (!textToPass) return;
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
              <div
                className="absolute inset-0 rounded-full bg-red-400/25 transition-transform duration-75"
                style={{ transform: `scale(${0.7 + level * 0.3})` }}
              ></div>
              <div className="absolute inset-0 rounded-full bg-emerald-300/20 animate-ping duration-1000"></div>
              <div className="absolute inset-4 rounded-full bg-emerald-400/25 animate-pulse duration-700"></div>
            </>
          )}

          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={isProcessing}
            className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${
              isRecording
                ? "bg-red-600 text-white ring-8 ring-red-200"
                : "bg-gradient-to-br from-brand-primary to-brand-deep text-white ring-8 ring-emerald-100 hover:shadow-2xl"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-white animate-spin mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  {language === "mr" ? "ओळखत आहे" : "Recognising"}
                </span>
              </>
            ) : isRecording ? (
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
          {isRecording && (
            <p className="text-[11px] text-slate-500 font-medium mt-2">
              {language === "mr"
                ? "फोन तोंडापासून एका हाताच्या अंतरावर धरा. बोलून झाल्यावर थांबवा दाबा."
                : "Hold the phone about a hand's length away. Tap stop when you finish."}
            </p>
          )}
        </div>

        {errorCode && (
          <div className="w-full flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{(ERRORS[errorCode] ?? ERRORS.STT_FAILED)[language === "mr" ? "mr" : "en"]}</span>
          </div>
        )}

        {/* Transcribed Text Preview Box */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              <span>{t.transcribedSpeechText}</span>
            </span>
            {result?.provider === "mock" && (
              <span className="px-2 py-0.5 rounded-md text-[10px] text-slate-600 bg-slate-100">
                {language === "mr" ? "चाचणी मजकूर (खरी ओळख नाही)" : "Test text (not real recognition)"}
              </span>
            )}
            {result?.confidence != null && result.provider !== "mock" && (
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] ${
                  result.needsReview ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"
                }`}
              >
                {language === "mr" ? "अचूकता" : "Confidence"} {Math.round(result.confidence * 100)}%
              </span>
            )}
          </div>

          <textarea
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            disabled={isRecording || isProcessing}
            placeholder={t.orderTextPlaceholder}
            rows={4}
            lang="mr"
            className={`w-full min-h-[100px] p-4 rounded-2xl border text-sm sm:text-base font-semibold transition leading-relaxed resize-y outline-none focus:ring-2 focus:ring-emerald-200 ${
              transcribedText
                ? "bg-white border-emerald-300 text-slate-900 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          />

          {result?.needsReview && (
            <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1">
              <p>
                {language === "mr"
                  ? "काही शब्दांबद्दल खात्री नाही. कृपया मजकूर तपासा आणि गरज असल्यास दुरुस्त करा."
                  : "Some words may be wrong. Please check the text and correct it if needed."}
              </p>
              {result.lowConfidenceWords.length > 0 && (
                <p className="flex flex-wrap gap-1">
                  {result.lowConfidenceWords.map((w) => (
                    <span key={w} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      {w}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Submit Button */}
      <button
        type="button"
        disabled={!transcribedText.trim() || isRecording || isProcessing}
        onClick={handleProceed}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition ${
          transcribedText.trim() && !isRecording && !isProcessing
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
    <DataGate ready={shops.length > 0 && villages.length > 0} emptyMr="अजून दुकान नाही. आधी दुकान जोडा." emptyEn="No shops yet. Add a shop first." href="/sales/villages" linkMr="गाव निवडा" linkEn="Select village">
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
