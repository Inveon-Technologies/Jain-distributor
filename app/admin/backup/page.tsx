"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { apiFetch, todayIST } from "@/lib/api";
import {
  Database,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Package,
} from "lucide-react";

interface BackupData {
  exportedAt?: string;
  version?: string;
  data: {
    villages?: Array<{ marathi_name: string; english_name: string; taluka?: string | null; district?: string | null; status?: string }>;
    items?: Array<{ name: string; marathi_name?: string | null; aliases?: string[] | null; unit: string; price?: number | null; status?: string }>;
    shops?: Array<{ name: string; name_en?: string | null; owner_name?: string | null; mobile?: string | null; address?: string | null; village_id?: string; outstanding_balance?: number | null }>;
    users?: Array<{ name: string; name_en?: string | null; email: string; mobile?: string | null; role?: string; status?: string }>;
    orders?: unknown[];
  };
}

interface RestoreResult {
  imported: {
    villages: number;
    items: number;
    shops: number;
    users: number;
  };
}

export default function BackupRestorePage() {
  const { language, refresh } = useApp();
  const mr = language === "mr";

  const [downloadingFull, setDownloadingFull] = useState(false);
  const [downloadingOrders, setDownloadingOrders] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState(false);

  // Restore states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<RestoreResult | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadEndpoint = async (path: string, filename: string, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jd_token") : null;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${baseUrl}${path}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert(mr ? "फाइल डाउनलोड करताना त्रुटी आली." : "Could not download export file.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportFull = () => {
    downloadEndpoint(
      "/dashboard/export/full",
      `jain-distributor-backup-${todayIST()}.json`,
      setDownloadingFull
    );
  };

  const handleExportOrders = () => {
    downloadEndpoint(
      "/dashboard/export/orders",
      `orders-${todayIST()}.csv`,
      setDownloadingOrders
    );
  };

  const handleExportItems = () => {
    downloadEndpoint(
      "/dashboard/export/items",
      `items-${todayIST()}.csv`,
      setDownloadingItems
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setParseError(null);
    setRestoreSuccess(null);
    setRestoreError(null);
    if (!file) {
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }
    if (!file.name.endsWith(".json")) {
      setParseError(mr ? "कृपया वैध .json बॅकअप फाइल निवडा." : "Please select a valid .json backup file.");
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== "object" || !json.data) {
          throw new Error("Invalid structure");
        }
        setPreviewData(json as BackupData);
      } catch {
        setParseError(
          mr
            ? "निवडलेली फाइल अवैध आहे किंवा बॅकअप फॉरमॅट योग्य नाही."
            : "The selected file is not a valid Jain Distributor backup JSON."
        );
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!previewData?.data) return;
    const confirmMsg = mr
      ? "तुम्हाला नक्की हा बॅकअप रिस्टोअर करायचा आहे का? डेटा अपडेट होईल."
      : "Are you sure you want to restore this backup? Existing records will be updated.";
    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);
    try {
      const res = await apiFetch<RestoreResult>("/dashboard/import/restore", {
        method: "POST",
        body: { data: previewData.data },
      });
      setRestoreSuccess(res);
      // Refresh global app state so new items/villages/shops appear immediately
      await refresh();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      setPreviewData(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRestoreError(msg || (mr ? "रिस्टोअर करताना त्रुटी आली." : "Restore failed."));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>{mr ? "डेटा नियंत्रण" : "Data Management"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {mr ? "डेटा बॅकअप, निर्यात व पुनर्संचयन" : "Data Export, Backup & Restore"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {mr
              ? "सर्व डेटा सुरक्षितपणे डाउनलोड करा किंवा जुना बॅकअप सहजपणे रिस्टोअर करा."
              : "Export all system data, maintain safe backups, and easily restore records anytime."}
          </p>
        </div>
      </div>

      {/* Grid: Left = Export Options, Right = Restore System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Data Export */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {mr ? "डेटा निर्यात (Export & Download)" : "Export System Data"}
                </h2>
                <p className="text-xs text-slate-500">
                  {mr ? "संपूर्ण डेटाबेस किंवा विशिष्ट यादी डाउनलोड करा." : "Download complete database or specific spreadsheets."}
                </p>
              </div>
            </div>

            {/* Export Card 1: Full JSON Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {mr ? "संपूर्ण डेटाबेस बॅकअप (Full JSON Backup)" : "Complete Database Backup (JSON)"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mr
                      ? "गावे, दुकाने, आयटम मास्टर, विक्रेते व ऑर्डर्स समाविष्ट आहेत."
                      : "Includes villages, shops, item catalog, salespersons, and orders."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportFull}
                disabled={downloadingFull}
                className="px-3.5 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingFull ? "..." : mr ? "डाउनलोड" : "Download"}</span>
              </button>
            </div>

            {/* Export Card 2: Orders CSV */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {mr ? "सर्व ऑर्डर्स (Orders CSV)" : "All Orders Spreadsheet (CSV)"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mr
                      ? "दुकान, गाव, विक्रेता आणि तपशीलवार साहित्यासह सर्व ऑर्डर्स."
                      : "Detailed orders with shop, village, salesperson, and line items."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportOrders}
                disabled={downloadingOrders}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingOrders ? "..." : mr ? "CSV काढा" : "Export CSV"}</span>
              </button>
            </div>

            {/* Export Card 3: Items Master CSV */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {mr ? "आयटम मास्टर सूची (Items Master CSV)" : "Item Master Catalog (CSV)"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mr
                      ? "सर्व साहित्यांची नावे, मराठी नावे, दर आणि एकके."
                      : "Item names, Marathi names, aliases, units, and prices."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportItems}
                disabled={downloadingItems}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingItems ? "..." : mr ? "CSV काढा" : "Export CSV"}</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {mr
                ? "टीप: नियमित बॅकअप घेतल्यास भविष्यात डेटा सुरक्षित राहतो."
                : "Tip: Regular backups protect your field sales operations and records."}
            </span>
          </div>
        </div>

        {/* Section 2: Data Restore */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mr ? "डेटा रिस्टोअर (Backup Restore)" : "Restore from Backup"}
              </h2>
              <p className="text-xs text-slate-500">
                {mr ? "अगोदर घेतलेली .json बॅकअप फाइल निवडून सिस्टिम अपडेट करा." : "Upload a previously downloaded .json backup file."}
              </p>
            </div>
          </div>

          {/* File Upload Drop Area */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-upload"
            />
            <label
              htmlFor="backup-file-upload"
              className="border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20"
            >
              <FileJson className="w-10 h-10 text-brand-primary/60" />
              <div className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : (mr ? "बॅकअप फाइल (.json) निवडा" : "Select Backup JSON File")}
              </div>
              <p className="text-xs text-slate-400">
                {mr ? "फाइल निवडण्यासाठी येथे क्लिक करा" : "Click to browse and choose backup file"}
              </p>
            </label>

            {/* Parse Error */}
            {parseError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview of Backup Data */}
            {previewData && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {mr ? "बॅकअप सारांश (Preview)" : "Backup Content Preview"}
                  </span>
                  {previewData.exportedAt && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {new Date(previewData.exportedAt).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block">{mr ? "गावे" : "Villages"}</span>
                    <span className="text-sm font-black text-slate-800">
                      {previewData.data.villages?.length ?? 0}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block">{mr ? "साहित्य" : "Items"}</span>
                    <span className="text-sm font-black text-slate-800">
                      {previewData.data.items?.length ?? 0}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block">{mr ? "दुकाने" : "Shops"}</span>
                    <span className="text-sm font-black text-slate-800">
                      {previewData.data.shops?.length ?? 0}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block">{mr ? "विक्रेते" : "Users"}</span>
                    <span className="text-sm font-black text-slate-800">
                      {previewData.data.users?.length ?? 0}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isRestoring ? "animate-spin" : ""}`} />
                  <span>
                    {isRestoring
                      ? (mr ? "डेटा रिस्टोअर होत आहे..." : "Restoring data...")
                      : (mr ? "हा बॅकअप आता रिस्टोअर करा" : "Restore this Backup Now")}
                  </span>
                </button>
              </div>
            )}

            {/* Restore Success Banner */}
            {restoreSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{mr ? "डेटा यशस्वीरित्या रिस्टोअर झाला!" : "Backup restored successfully!"}</span>
                </div>
                <div className="text-xs space-y-1 text-emerald-800 font-medium">
                  <p>✓ {mr ? "गावे:" : "Villages:"} {restoreSuccess.imported.villages}</p>
                  <p>✓ {mr ? "आयटम मास्टर:" : "Items:"} {restoreSuccess.imported.items}</p>
                  <p>✓ {mr ? "दुकाने:" : "Shops:"} {restoreSuccess.imported.shops}</p>
                  <p>✓ {mr ? "विक्रेते:" : "Salespersons:"} {restoreSuccess.imported.users}</p>
                </div>
              </div>
            )}

            {/* Restore Error Banner */}
            {restoreError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
