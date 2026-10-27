"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { formatBilingual, autoBilingualName } from "@/utils/transliterate";
import { BilingualName } from "@/components/common/BilingualName";
import { Shop } from "@/data/mockData";
import { Store, MapPin, Phone, Search, Trash2, Pencil, X, Check } from "lucide-react";

export default function AdminShopsPage() {
  const { language, shops, villages, updateShop, deleteShop } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("ALL");
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [shopToEdit, setShopToEdit] = useState<Shop | null>(null);

  const [editShopName, setEditShopName] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editVillageId, setEditVillageId] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const openEditModal = (s: Shop) => {
    setShopToEdit(s);
    setEditShopName(language === "en" ? (s.nameEn || s.name) : (s.name || s.nameEn));
    setEditOwnerName(language === "en" ? (s.ownerEn || s.owner) : (s.owner || s.ownerEn));
    setEditMobile(s.mobile);
    setEditVillageId(s.villageId);
    setEditAddress(language === "en" ? (s.addressEn || s.address) : (s.address || s.addressEn));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopToEdit || !editShopName.trim() || !editOwnerName.trim()) return;

    const shopPair = autoBilingualName(editShopName);
    const ownerPair = autoBilingualName(editOwnerName);
    const addressPair = autoBilingualName(editAddress);

    updateShop(shopToEdit.id, {
      name: shopPair.mr,
      nameEn: shopPair.en,
      owner: ownerPair.mr,
      ownerEn: ownerPair.en,
      mobile: editMobile.trim() || shopToEdit.mobile,
      villageId: editVillageId,
      address: addressPair.mr,
      addressEn: addressPair.en,
    });

    setShopToEdit(null);
  };

  const filteredShops = shops.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
      (s.ownerEn && s.ownerEn.toLowerCase().includes(q));
    const matchesVillage =
      selectedVillageId === "ALL" || s.villageId === selectedVillageId;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {t.shops}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {language === "mr"
              ? "सर्व गावांतील नोंदणीकृत किराणा दुकानांची माहिती व संपर्क व्यवस्थापित करा."
              : "Manage partner retail kirana stores, owner contacts, and locations."}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-white text-brand-primary border border-slate-200 text-xs font-bold self-start sm:self-auto shadow-xs">
          {shops.length} {t.totalStoresCount}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "mr" ? "दुकान किंवा मालकाचे नाव शोधा..." : "Search shops or owners..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        <select
          value={selectedVillageId}
          onChange={(e) => setSelectedVillageId(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="ALL">
            {t.allVillages}
          </option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {formatBilingual(v.marathiName, v.englishName, language)}
            </option>
          ))}
        </select>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShops.map((s) => {
          const v = villages.find((item) => item.id === s.villageId);
          return (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        <BilingualName
                          mr={s.name}
                          en={s.nameEn}
                          secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                        />
                      </h3>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <span>{t.shopOwner}:</span>
                        <BilingualName
                          mr={s.owner}
                          en={s.ownerEn}
                          className="font-semibold text-slate-700"
                          secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                        />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      title={t.editShop}
                      className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopToDelete(s)}
                      title={t.deleteShop}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600 mt-3">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <BilingualName
                        mr={v?.marathiName}
                        en={v?.englishName}
                        className="font-bold text-slate-800"
                        secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                      />
                      {" "}• {language === "en" ? (s.addressEn || s.address) : s.address}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.mobile}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Shop Modal */}
      {shopToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {t.editShop}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {t.editModalTitle}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShopToEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.shopNameLabel} *
                </label>
                <input
                  type="text"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  placeholder="e.g. Mahavir Kirana, Shree Samarth"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === "mr"
                    ? "इंग्रजी किंवा मराठीत नाव टाका, दोन्ही भाषांत आपोआप सेव्ह होईल."
                    : "Type in English or Marathi, will auto-save in both languages."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.ownerNameLabel} *
                </label>
                <input
                  type="text"
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  placeholder="e.g. Varsha Patil, Kedar"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.mobileLabel}
                </label>
                <input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  placeholder="+91 98220 00000"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.selectVillagePrompt} *
                </label>
                <select
                  value={editVillageId}
                  onChange={(e) => setEditVillageId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  required
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatBilingual(v.marathiName, v.englishName, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.addressLabel}
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Near Bus Stand, Main Road"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShopToEdit(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveChanges}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {shopToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t.deleteConfirmTitle}
                </h3>
                <span className="text-xs text-slate-600 font-medium block truncate max-w-[200px]">
                  <BilingualName
                    mr={shopToDelete.name}
                    en={shopToDelete.nameEn}
                    className="font-bold text-slate-800"
                    secondaryClassName="text-[11px] font-normal text-slate-400 ml-1"
                  />
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.deleteShopConfirmMsg}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShopToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteShop(shopToDelete.id);
                  setShopToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
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
