"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ClipboardList, UserPlus, X, BellRing } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";

interface NewOrderData {
  orderNumber: number;
  status: "CONFIRMED" | "DELIVERED" | "CANCELLED";
  itemCount: number;
  shopName: string;
  villageMr: string;
  villageEn: string;
  salespersonName: string;
  salespersonNameEn: string | null;
}

interface SignupData {
  name: string;
  nameEn: string | null;
  mobile: string | null;
}

type AppNotification =
  | { type: "NEW_ORDER"; id: string; createdAt: string; data: NewOrderData }
  | { type: "SIGNUP"; id: string; createdAt: string; data: SignupData };

/** localStorage key holding the time the admin last opened the bell. */
const SEEN_KEY = "jd_notifications_seen";
const POLL_MS = 30_000;

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSeen(time: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(time));
  } catch {
    /* private mode: the badge just resets on reload */
  }
}

function timeAgo(iso: string, mr: boolean): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (minutes < 1) return mr ? "आत्ताच" : "just now";
  if (minutes < 60) return mr ? `${minutes} मिनिटांपूर्वी` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return mr ? `${hours} तासांपूर्वी` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return mr ? `${days} दिवसांपूर्वी` : `${days} d ago`;
}

/** A short two-tone chime, so a new order is noticed even when the admin is looking elsewhere. */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    /* sound is optional */
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { language, refresh } = useApp();
  const mr = language === "mr";

  const [items, setItems] = useState<AppNotification[]>([]);
  const [seen, setSeen] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const newestRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const title = useCallback(
    (n: AppNotification) => {
      if (n.type === "SIGNUP") {
        const name = mr ? n.data.name : n.data.nameEn || n.data.name;
        return mr ? `${name} यांनी नोंदणी केली, मंजुरी हवी` : `${name} signed up and needs approval`;
      }
      const sp = mr ? n.data.salespersonName : n.data.salespersonNameEn || n.data.salespersonName;
      if (n.data.status === "CANCELLED") {
        return mr ? `ऑर्डर #${n.data.orderNumber} रद्द झाली` : `Order #${n.data.orderNumber} was cancelled`;
      }
      return mr ? `${sp} कडून नवीन ऑर्डर #${n.data.orderNumber}` : `New order #${n.data.orderNumber} from ${sp}`;
    },
    [mr],
  );

  const detail = useCallback(
    (n: AppNotification) => {
      if (n.type === "SIGNUP") return n.data.mobile ?? "";
      const village = mr ? n.data.villageMr : n.data.villageEn;
      const count = mr ? `${n.data.itemCount} वस्तू` : `${n.data.itemCount} item${n.data.itemCount === 1 ? "" : "s"}`;
      return `${n.data.shopName} · ${village} · ${count}`;
    },
    [mr],
  );

  const load = useCallback(async () => {
    try {
      const { data } = await apiFetch<{ data: AppNotification[] }>("/notifications");
      setFailed(false);
      setItems(data);
      const newest = data.length ? Date.parse(data[0].createdAt) : 0;
      const previous = newestRef.current;
      newestRef.current = Math.max(previous ?? 0, newest);
      // Alert only for things that arrived after the page was opened, not on the first load.
      if (previous !== null && newest > previous) {
        const fresh = data.filter((n) => Date.parse(n.createdAt) > previous);
        chime();
        if (fresh.some((n) => n.type === "NEW_ORDER")) void refresh();
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
          const first = fresh[0];
          new Notification(mr ? "जैन डिस्ट्रिब्युटर" : "Jain Distributor", {
            body: fresh.length > 1 ? `${title(first)} (+${fresh.length - 1})` : title(first),
            tag: "jd-admin",
            icon: "/icon.png",
          });
        }
      }
    } catch {
      setFailed(true);
    }
  }, [mr, refresh, title]);

  useEffect(() => {
    setSeen(readSeen());
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Close when tapping outside the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const unread = items.filter((n) => Date.parse(n.createdAt) > seen).length;

  const markAllRead = () => {
    const now = Math.max(Date.now(), newestRef.current ?? 0);
    writeSeen(now);
    setSeen(now);
  };

  const toggle = () => {
    if (open) markAllRead();
    setOpen(!open);
  };

  const go = (n: AppNotification) => {
    markAllRead();
    setOpen(false);
    router.push(n.type === "NEW_ORDER" ? `/admin/orders/${n.id}` : "/admin/salespersons");
  };

  const enableAlerts = async () => {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={mr ? "सूचना" : "Notifications"}
        className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 cursor-pointer transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">{mr ? "सूचना" : "Notifications"}</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                >
                  {mr ? "सर्व वाचले" : "Mark all read"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  markAllRead();
                  setOpen(false);
                }}
                aria-label={mr ? "बंद करा" : "Close"}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {permission === "default" && (
            <button
              type="button"
              onClick={enableAlerts}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 text-xs font-semibold border-b border-amber-100 text-left cursor-pointer"
            >
              <BellRing className="w-4 h-4 shrink-0" />
              {mr ? "नवीन ऑर्डरसाठी फोनवर अलर्ट चालू करा" : "Turn on alerts for new orders"}
            </button>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {failed && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-red-600">
                {mr ? "सूचना आणता आल्या नाहीत. इंटरनेट तपासा." : "Could not load notifications. Check your connection."}
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                {mr ? "मागील 3 दिवसांत काही नवीन नाही." : "Nothing new in the last 3 days."}
              </p>
            ) : (
              items.map((n) => {
                const isNew = Date.parse(n.createdAt) > seen;
                const Icon = n.type === "SIGNUP" ? UserPlus : ClipboardList;
                return (
                  <button
                    key={`${n.type}-${n.id}`}
                    type="button"
                    onClick={() => go(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${
                      isNew ? "bg-emerald-50/60" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        n.type === "SIGNUP" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-brand-primary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 leading-snug">{title(n)}</span>
                      {detail(n) && <span className="block text-xs text-slate-500 truncate">{detail(n)}</span>}
                      <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt, mr)}</span>
                    </span>
                    {isNew && <span className="mt-2 w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
