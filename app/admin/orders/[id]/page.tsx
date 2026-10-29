"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DataGate } from "@/components/common/DataGate";
import { translations } from "@/data/translations";
import { BilingualName } from "@/components/common/BilingualName";
import {
  ArrowLeft,
  Store,
  User,
  Mic,
  Package,
  CheckCircle2,
  Printer,
} from "lucide-react";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { language, orders, shops, villages, salespersons } = useApp();
  const t = translations[language];

  const order = orders.find((o) => o.id === orderId);
  const shop = shops.find((s) => s.id === order?.shopId);
  const village = villages.find((v) => v.id === order?.villageId);
  const salesperson = salespersons.find((s) => s.id === order?.salespersonId);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const totalQuantity =
    order?.items.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

  if (!order) {
    return (
      <DataGate ready={false} emptyMr="ऑर्डर सापडली नाही." emptyEn="Order not found." href="/admin/orders" linkMr="ऑर्डर्स यादी" linkEn="All orders">
        {null}
      </DataGate>
    );
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SCREEN VIEW (Hidden during print)                                      */}
      {/* ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Top Header & Breadcrumb Back */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/orders")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-deep mb-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === "mr" ? "ऑर्डर्स यादीकडे परत" : "Back to Orders"}</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                {t.orderDetails}
              </h1>
              <span className="font-mono text-sm px-3 py-1 rounded-xl bg-slate-100 font-bold text-slate-700">
                {order?.displayId}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {language === "mr"
                ? "रेकॉर्ड केलेली व्हॉईस ऑर्डर आणि संबंधित दुकानाची संपूर्ण माहिती."
                : "Review the voice-transcribed order and associated retail shop information."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
              title={language === "mr" ? "ऑर्डर प्रिंट करा" : "Print Order"}
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{language === "mr" ? "प्रिंट काढा" : "Print"}</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-brand-primary border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.confirmed}</span>
            </span>
          </div>
        </div>

        {/* Prominent Recorded Order Voice-to-Text Box */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-primary flex items-center justify-center font-bold">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t.recordedTextLabel}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Source: Marathi speech-to-text engine (`mr-IN`)
              </span>
            </div>
          </div>

          {/* Big Marathi Speech Text */}
          <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-900 text-xl sm:text-2xl font-bold leading-relaxed font-marathi">
            &ldquo;{order?.transcribedText}&rdquo;
          </div>
        </section>

        {/* 3 Information Grid Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Shop Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === "mr" ? "दुकानाची माहिती" : "Shop Information"}
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "दुकानाचे नाव" : "Shop Name"}
                </span>
                <strong className="text-slate-900 font-bold block mt-0.5">
                  <BilingualName
                    mr={shop?.name}
                    en={shop?.nameEn}
                    secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                  />
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "गाव" : "Village"}
                </span>
                <span className="text-slate-800 font-bold block mt-0.5">
                  <BilingualName
                    mr={village?.marathiName}
                    en={village?.englishName}
                    secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                  />
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "मालक / संपर्क" : "Owner / Mobile"}
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5">
                  <BilingualName
                    mr={shop?.owner}
                    en={shop?.ownerEn}
                    secondaryClassName="text-xs font-normal text-slate-500 ml-1"
                  />
                  {" "}• {shop?.mobile}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "पत्ता" : "Address"}
                </span>
                <span className="text-slate-600 block mt-0.5">
                  {language === "en" ? (shop?.addressEn || shop?.address) : shop?.address}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Salesperson Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-slate-100 border-b">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === "mr" ? "सेल्समन माहिती" : "Salesperson Information"}
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "नाव" : "Salesperson Name"}
                </span>
                <strong className="text-slate-900 font-bold block mt-0.5">
                  <BilingualName
                    mr={salesperson?.name}
                    en={salesperson?.nameEn}
                    secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                  />
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "मोबाईल" : "Phone"}
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5">
                  {salesperson?.mobile || "+91 98220 12345"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "ई-मेल" : "Email"}
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5">
                  {salesperson?.email || ""}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-bold uppercase">
                  {language === "mr" ? "नोंदणी वेळ" : "Timestamp"}
                </span>
                <span className="text-slate-600 font-medium block mt-0.5">
                  {order?.createdAt}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Itemized Order List with Bottom-Right Print Tab */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {language === "mr" ? "साहित्य तपशील" : "Order Items"}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {order?.items.length || 0} {language === "mr" ? "वस्तू" : "Items"}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs sm:text-sm mt-1">
                {order?.items.map((it, idx) => {
                  const nameMatch = it.name.match(/^(.*?)\s*\((.*?)\)$/);
                  const unitMatch = it.unit.match(/^(.*?)\s*\((.*?)\)$/);

                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {nameMatch ? (
                            <BilingualName
                              mr={nameMatch[1]}
                              en={nameMatch[2]}
                              secondaryClassName="text-xs font-normal text-slate-500 ml-1.5"
                            />
                          ) : (
                            it.name
                          )}
                        </span>
                      </div>
                      <span className="font-extrabold text-brand-primary px-2.5 py-1 rounded-lg bg-emerald-50">
                        {it.quantity}{" "}
                        {unitMatch ? (
                          <BilingualName
                            mr={unitMatch[1]}
                            en={unitMatch[2]}
                            secondaryClassName="text-[10px] font-normal text-slate-500 ml-1"
                          />
                        ) : (
                          it.unit
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Right Print Tab */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {language === "mr" ? "एकूण नग:" : "Total Qty:"}{" "}
                <strong className="text-slate-700">{totalQuantity}</strong>
              </span>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer active:scale-95"
                title={language === "mr" ? "ऑर्डर पावती प्रिंट करा" : "Print Order Receipt"}
              >
                <Printer className="w-4 h-4" />
                <span>{language === "mr" ? "प्रिंट काढा" : "Print Order"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED PRINTABLE ORDER RECEIPT / DELIVERY CHALLAN (Print Only)      */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-slate-900 bg-white p-4 max-w-4xl mx-auto">
        {/* CSS rules for printing */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 12mm 10mm 12mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: #ffffff !important;
              }
            }
          `,
          }}
        />

        {/* Voucher Header with Official Jain Distributor Logo */}
        <div className="border-b-2 border-slate-800 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/logo-cropped.png"
                alt="Jain Distributor"
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  JAIN DISTRIBUTOR
                </h1>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  जैन डिस्ट्रीब्युटर • FMCG & Kirana Wholesale Distribution
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Station Road, Market Yard, Pandharpur, Dist. Solapur - 413304
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Phone: +91 98220 12345 / 94230 11223 • Email: orders@jaindistributor.in
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-extrabold rounded uppercase tracking-wider mb-1">
                Order Delivery Challan
              </span>
              <div className="text-sm font-bold text-slate-900">
                अधिकृत ऑर्डर पावती
              </div>
              <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                No: {order?.displayId}
              </div>
              <div className="text-[11px] text-slate-500">
                Date: {order?.createdAt}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Info: Customer / Retailer vs Order & Booking */}
        <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 text-xs mb-4 bg-slate-50/50">
          {/* Customer / Retailer Info */}
          <div className="space-y-1.5 border-r border-slate-200 pr-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              ग्राहक / दुकानाची माहिती (Customer Details)
            </span>
            <div className="text-sm font-black text-slate-900">
              {shop?.name} {shop?.nameEn && <span className="font-semibold text-slate-600">({shop.nameEn})</span>}
            </div>
            <div>
              <span className="font-bold text-slate-700">मालक (Owner):</span>{" "}
              {shop?.owner} {shop?.ownerEn && `(${shop.ownerEn})`}
            </div>
            <div>
              <span className="font-bold text-slate-700">गाव (Village):</span>{" "}
              {village?.marathiName} ({village?.englishName}), {village?.taluka}
            </div>
            <div>
              <span className="font-bold text-slate-700">मोबाईल (Phone):</span> {shop?.mobile}
            </div>
            <div>
              <span className="font-bold text-slate-700">पत्ता (Address):</span> {shop?.address}
            </div>
          </div>

          {/* Salesperson & Dispatch Info */}
          <div className="space-y-1.5 pl-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              ऑर्डर व वितरण माहिती (Order & Dispatch Info)
            </span>
            <div>
              <span className="font-bold text-slate-700">ऑर्डर क्रमांक:</span>{" "}
              <span className="font-mono font-bold text-slate-900">{order?.displayId}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">नोंदणी तारीख:</span> {order?.createdAt}
            </div>
            <div>
              <span className="font-bold text-slate-700">सेल्समन (Booked by):</span>{" "}
              {salesperson?.name} {salesperson?.nameEn && `(${salesperson.nameEn})`}
            </div>
            <div>
              <span className="font-bold text-slate-700">सेल्समन संपर्क:</span>{" "}
              {salesperson?.mobile || "+91 98220 12345"}
            </div>
            <div>
              <span className="font-bold text-slate-700">ऑर्डर स्थिती:</span>{" "}
              <span className="font-bold text-emerald-700">CONFIRMED (नोंद पूर्ण)</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">नोंदणी पद्धत:</span>{" "}
              <span>मराठी व्हॉईस इनपुट (Voice Speech-to-Text)</span>
            </div>
          </div>
        </div>

        {/* Marathi Voice Audio Transcript Reference */}
        {order?.transcribedText && (
          <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50/60 text-xs mb-4">
            <span className="font-bold text-emerald-900 block text-[11px]">
              मुळ व्हॉईस रेकॉर्डिंग संदर्भ (Voice Audio Transcript):
            </span>
            <p className="italic text-slate-800 mt-0.5">
              &ldquo;{order.transcribedText}&rdquo;
            </p>
          </div>
        )}

        {/* Itemized Table */}
        <div className="mb-4">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-300">
                <th className="py-2 px-3 text-center border-r border-slate-300 w-12 font-bold">
                  अ.क्र.
                </th>
                <th className="py-2 px-3 text-left border-r border-slate-300 font-bold">
                  साहित्याचे नाव (Item Description)
                </th>
                <th className="py-2 px-3 text-center border-r border-slate-300 w-28 font-bold">
                  प्रमाण (Quantity)
                </th>
                <th className="py-2 px-3 text-center border-r border-slate-300 w-28 font-bold">
                  एकक (Unit)
                </th>
                <th className="py-2 px-3 text-center w-28 font-bold">
                  गोडावून तपासणी (Check)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order?.items.map((it, idx) => {
                const nameMatch = it.name.match(/^(.*?)\s*\((.*?)\)$/);
                const unitMatch = it.unit.match(/^(.*?)\s*\((.*?)\)$/);

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {nameMatch ? (
                        <span>
                          {nameMatch[1]}{" "}
                          <span className="text-slate-500 font-normal">({nameMatch[2]})</span>
                        </span>
                      ) : (
                        it.name
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-black text-slate-900 border-r border-slate-200 text-sm">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                      {unitMatch ? `${unitMatch[1]} (${unitMatch[2]})` : it.unit}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="w-4 h-4 border border-slate-400 rounded-xs mx-auto"></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td colSpan={2} className="py-2 px-3 text-right border-r border-slate-300">
                  एकूण वस्तू संख्या (Total Items): {order?.items.length || 0}
                </td>
                <td className="py-2 px-3 text-center border-r border-slate-300 text-sm font-black">
                  {totalQuantity}
                </td>
                <td colSpan={2} className="py-2 px-3 text-slate-500 text-[11px]">
                  (एकूण नग/किलो/लिटर प्रमाण)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>
            * ही संगणकीय प्रणालीद्वारे तयार केलेली अधिकृत ऑर्डर पावती आहे.
          </span>
          <span>
            Jain Distributor, Pandharpur • Technology Partner: Inveon Technologies
          </span>
        </div>
      </div>
    </>
  );
}