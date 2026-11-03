"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { apiFetch, ApiError } from "@/lib/api";
import type { ItemSuggestion, MasterItem } from "@/data/types";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const PAGE_SIZE = 50;

interface ImportSummary {
  read: number;
  added: number;
  alreadyInMaster: number;
  skippedCount: number;
  skipped: { line: number; text: string; reason: string }[];
}

interface ItemForm {
  name: string;
  marathiName: string;
  aliases: string;
  unit: string;
  price: string;
  status: "ACTIVE" | "INACTIVE";
}

const emptyForm: ItemForm = { name: "", marathiName: "", aliases: "", unit: "PCS", price: "", status: "ACTIVE" };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

const formatPrice = (p: number | null) => (p === null || p === undefined ? "—" : `₹${Number(p).toLocaleString("en-IN")}`);

export default function AdminItemsPage() {
  const { language } = useApp();
  const t = translations[language];
  const mr = language === "mr";

  const [items, setItems] = useState<MasterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = useDebounced(query.trim(), 300);

  const [editing, setEditing] = useState<MasterItem | "new" | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<MasterItem | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  const [tryText, setTryText] = useState("");
  const tryQ = useDebounced(tryText.trim(), 300);
  const [trySuggestions, setTrySuggestions] = useState<ItemSuggestion[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (q) params.set("q", q);
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch<{ data: MasterItem[]; meta: { total: number } }>(`/items?${params}`);
      setItems(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load items");
    } finally {
      setLoading(false);
    }
  }, [page, q, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  useEffect(() => {
    if (!tryQ) {
      setTrySuggestions([]);
      return;
    }
    let cancelled = false;
    apiFetch<{ data: ItemSuggestion[] }>(`/items/suggest?${new URLSearchParams({ q: tryQ, limit: "6" })}`)
      .then((res) => !cancelled && setTrySuggestions(res.data))
      .catch(() => !cancelled && setTrySuggestions([]));
    return () => {
      cancelled = true;
    };
  }, [tryQ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openNew = () => {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  };

  const openEdit = (item: MasterItem) => {
    setForm({
      name: item.name,
      marathiName: item.marathiName ?? "",
      aliases: item.aliases.join(", "),
      unit: item.unit,
      price: item.price === null ? "" : String(item.price),
      status: item.status,
    });
    setFormError("");
    setEditing(item);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const price = form.price.trim() === "" ? null : Number(form.price);
    if (price !== null && (Number.isNaN(price) || price < 0)) {
      setFormError(mr ? "किंमत बरोबर टाका." : "Enter a valid price.");
      return;
    }
    const body = {
      name: form.name,
      marathiName: form.marathiName.trim() || null,
      aliases: form.aliases
        .split(/[,\n]/)
        .map((a) => a.trim())
        .filter(Boolean),
      unit: form.unit,
      price,
      status: form.status,
    };
    setSaving(true);
    setFormError("");
    try {
      if (editing === "new") await apiFetch("/items", { method: "POST", body });
      else if (editing) await apiFetch(`/items/${editing.id}`, { method: "PATCH", body });
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? mr
            ? "हे आयटम (नाव व पॅकिंग) आधीच आहे."
            : "An item with this name and packing already exists."
          : err instanceof ApiError
            ? err.message
            : "Could not save the item",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await apiFetch(`/items/${toDelete.id}`, { method: "DELETE" });
      setToDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the item");
      setToDelete(null);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImportText(await file.text());
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await apiFetch<{ data: ImportSummary }>("/items/import", { method: "POST", body: { text: importText } });
      setImportResult(res.data);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not import the list");
    } finally {
      setImporting(false);
    }
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportText("");
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">{t.itemMaster}</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {mr
              ? "सेल्समन मराठीत बोलल्यावर याच यादीतून वस्तू आपोआप सुचवल्या जातात."
              : "Spoken Marathi orders are matched to these items automatically."}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{mr ? "यादी आयात करा" : "Import list"}</span>
          </button>
          <button
            type="button"
            onClick={openNew}
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{mr ? "नवीन आयटम" : "Add item"}</span>
          </button>
        </div>
      </div>

      {/* Try the voice matching */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{mr ? "आवाज जुळणी तपासा" : "Test voice matching"}</h2>
            <p className="text-[11px] text-slate-500">
              {mr
                ? "सेल्समन जसे बोलतो तसे मराठीत लिहा, उदा. पार्ले जी दहा रुपये"
                : "Type what a salesperson would say, e.g. पार्ले जी दहा रुपये or निव्हिया क्रीम"}
            </p>
          </div>
        </div>
        <input
          type="text"
          value={tryText}
          onChange={(e) => setTryText(e.target.value)}
          placeholder="पार्ले जी दहा रुपये"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        {tryQ && (
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {trySuggestions.length === 0 && (
              <li className="px-4 py-3 text-xs text-amber-700 bg-amber-50">
                {mr
                  ? "काहीही जुळले नाही. योग्य आयटममध्ये हे नाव 'बोलण्याची नावे' मध्ये जोडा."
                  : "No match. Add this wording to the right item's spoken names."}
              </li>
            )}
            {trySuggestions.map((s, i) => (
              <li key={s.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className={`font-bold ${i === 0 ? "text-brand-primary" : "text-slate-800"}`}>{s.name}</span>
                  {s.marathiName && <span className="text-xs text-slate-500 ml-2">{s.marathiName}</span>}
                  <span className="text-[11px] text-slate-400 ml-2">{s.unit}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 shrink-0">{Math.round(s.score * 100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Item list */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mr ? "नाव शोधा (English किंवा मराठी)" : "Search name (English or मराठी)"}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            >
              <option value="">{mr ? "सर्व" : "All"}</option>
              <option value="ACTIVE">{mr ? "सक्रिय" : "Active"}</option>
              <option value="INACTIVE">{mr ? "बंद" : "Inactive"}</option>
            </select>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {total.toLocaleString("en-IN")} {mr ? "आयटम" : "items"}
            </span>
          </div>
        </div>

        {error && <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left font-bold px-4 py-3">{mr ? "आयटम" : "Item"}</th>
                <th className="text-left font-bold px-4 py-3">{mr ? "पॅकिंग" : "Packing"}</th>
                <th className="text-right font-bold px-4 py-3">MRP</th>
                <th className="text-left font-bold px-4 py-3 hidden md:table-cell">{mr ? "बोलण्याची नावे" : "Spoken names"}</th>
                <th className="text-left font-bold px-4 py-3">{mr ? "स्थिती" : "Status"}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {q
                      ? mr
                        ? "या शोधासाठी आयटम सापडला नाही."
                        : "No items match this search."
                      : mr
                        ? "अजून आयटम नाहीत. यादी आयात करा."
                        : "No items yet. Import your item list."}
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    {item.marathiName && <span className="text-xs text-slate-500">{item.marathiName}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-slate-700 whitespace-nowrap">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {item.aliases.slice(0, 4).map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                          {a}
                        </span>
                      ))}
                      {item.aliases.length > 4 && (
                        <span className="text-[11px] text-slate-400">+{item.aliases.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status === "ACTIVE" ? (mr ? "सक्रिय" : "Active") : mr ? "बंद" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        title={mr ? "बदला" : "Edit"}
                        className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(item)}
                        title={mr ? "काढा" : "Delete"}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between border-t border-slate-100 text-xs font-semibold text-slate-500">
          <span>{loading ? (mr ? "लोड होत आहे..." : "Loading...") : `${mr ? "पान" : "Page"} ${page} / ${totalPages}`}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Add / edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editing === "new" ? (mr ? "नवीन आयटम" : "Add item") : mr ? "आयटम बदला" : "Edit item"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Field label={mr ? "आयटमचे नाव (बिलिंगप्रमाणे) *" : "Item name (as billed) *"}>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="PARLE G RS 10"
                  className={inputClass}
                />
              </Field>
              <Field
                label={mr ? "मराठी नाव" : "Marathi name"}
                hint={mr ? "सेल्समनला हे नाव दिसते." : "Shown to salespersons."}
              >
                <input
                  type="text"
                  value={form.marathiName}
                  onChange={(e) => setForm({ ...form, marathiName: e.target.value })}
                  placeholder="पार्ले जी १० रुपये"
                  className={inputClass}
                />
              </Field>
              <Field
                label={mr ? "बोलण्याची नावे" : "Spoken names (aliases)"}
                hint={
                  mr
                    ? "सेल्समन हे आयटम कसे म्हणतात ते स्वल्पविरामाने लिहा. उदा. पारले ग्लुकोज, जी बिस्किट"
                    : "Other ways salespersons say this item, separated by commas, e.g. पारले ग्लुकोज, जी बिस्किट"
                }
              >
                <textarea
                  rows={2}
                  value={form.aliases}
                  onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={mr ? "पॅकिंग" : "Packing"} hint="PCS, PKT 30, JAR 150, DOZ">
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="MRP (₹)" hint={mr ? "रिकामे ठेवल्यास नावातील RS घेतले जाईल" : "Taken from “RS 10” in the name if empty"}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label={mr ? "स्थिती" : "Status"}>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ItemForm["status"] })}
                  className={inputClass}
                >
                  <option value="ACTIVE">{mr ? "सक्रिय (आवाजात सुचवा)" : "Active (suggested for voice orders)"}</option>
                  <option value="INACTIVE">{mr ? "बंद" : "Inactive"}</option>
                </select>
              </Field>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{formError}</div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveChanges}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{mr ? "आयटम यादी आयात करा" : "Import item list"}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mr
                    ? "प्रत्येक ओळीत: नाव <TAB> पॅकिंग (बिलिंग सॉफ्टवेअरमधून किंवा Excel मधून कॉपी करा). आधी असलेले आयटम बदलले जात नाहीत."
                    : "One item per line: name <TAB> packing (copy from the billing software or Excel). Items already in the master are left as they are."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeImport}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              accept=".txt,.tsv,.csv,.md,text/plain,text/csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-brand-primary file:font-bold"
            />
            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"PARLE G RS 10\tPCS\nCOLGATE PASTE RS 20\tPCS\nCHIKKI RS 5\tPKT 30"}
              className={`${inputClass} font-mono text-xs`}
            />

            {importResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <p className="font-bold">
                  {mr
                    ? `${importResult.added} नवीन आयटम जोडले, ${importResult.alreadyInMaster} आधीच होते, ${importResult.skippedCount} ओळी वगळल्या.`
                    : `${importResult.added} items added, ${importResult.alreadyInMaster} already in the master, ${importResult.skippedCount} lines skipped.`}
                </p>
                {importResult.skipped.length > 0 && (
                  <ul className="max-h-32 overflow-y-auto space-y-0.5 text-emerald-800">
                    {importResult.skipped.map((s) => (
                      <li key={s.line}>
                        {mr ? "ओळ" : "Line"} {s.line}: {s.reason} {s.text && <span className="text-emerald-600">({s.text})</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeImport}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {importResult ? (mr ? "बंद करा" : "Close") : t.cancel}
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !importText.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? (mr ? "आयात होत आहे..." : "Importing...") : mr ? "आयात करा" : "Import"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">{t.deleteConfirmTitle}</h3>
                <span className="text-xs font-bold text-slate-700 block truncate">{toDelete.name}</span>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              {mr
                ? "हा आयटम आवाज सूचनांमध्ये दिसणार नाही. जुन्या ऑर्डर्स जशाच्या तशा राहतील."
                : "The item will no longer be suggested for voice orders. Past orders keep it."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
              >
                {t.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
