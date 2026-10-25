# Jain Distributor – Sales Field Management System (`jain-distributor-web`)

**Client:** Jain Distributor, Pandharpur (`jaindistributor.in`)  
**Prepared by:** Inveon Technologies  
**Doc ID Reference:** `INV-JDS-PRD-01` (Version 1.0 MVP)

---

## 📌 Project Overview
This is a modern, responsive **Next.js 14** web application built with **React**, **TypeScript**, and **Tailwind CSS**. It replaces manual paper registers with a digital field order collection and operations management system for Jain Distributor, Pandharpur.

The application houses two distinct, role-based portals behind a single unified login:
1. **📱 Salesperson Field Portal (`/sales`)**: Mobile-first, native Marathi-language interface for field sales representatives to select villages, choose retail shops, and record orders via voice.
2. **💻 Admin Back-Office Dashboard (`/admin`)**: Desktop management portal providing real-time visibility into active salespersons, village visits, shops visited, and voice-transcribed orders.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials (Single Unified Login)

On the root login page (`http://localhost:3000`), enter either of the following or use the 1-click Quick Login buttons:

| Role | Email | Password | Assigned Landing Page |
| :--- | :--- | :--- | :--- |
| **Salesperson (अमोल पाटील)** | `amol@jain.com` | `sales123` | `/sales/home` |
| **Admin (प्रशासक / Management)** | `admin@jain.com` | `admin123` | `/admin/dashboard` |

---

## 📱 Salesperson Flow (Field Force)
* **`/sales/home`**: Home welcome dashboard showing 3-step process and quick order statistics.
* **`/sales/villages`**: **गाव निवडा** (Select Village: सांगोला, अकलूज, वाखरी, मंगळवेढा, पंढरपूर).
* **`/sales/shops`**: **दुकान निवडा** (View village shops like श्री गणेश किराणा, साई किराणा, माऊली ट्रेडर्स) + **नवीन दुकान जोडा** button.
* **`/sales/shops/new`**: **नवीन दुकान नोंदणी** (Form to register a new village shop).
* **`/sales/order/record`**: **ऑर्डर नोंदवा** (Interactive pulsing microphone button to speak orders in Marathi).
* **`/sales/order/review`**: **ऑर्डर तपासा** (Review transcribed speech, ✏️ Edit text, adjustable item quantities, and 🔄 Re-record).
* **`/sales/order/success`**: **ऑर्डर जतन झाली** (Confirmation screen with reference ID).
* **`/sales/orders/today`**: **आजच्या ऑर्डर्स** (Today's logged orders with timestamps and items).
* **`/sales/profile`**: **माझे प्रोफाइल** (Salesperson territory and daily stats).

---

## 💻 Admin / Back-Office Dashboard
* **`/admin/dashboard`**: Executive overview featuring:
  * **4 KPI Summary Cards**: Active Salespersons (10/12), Today's Village Visits (28), Today's Shops Visited (65), Today's Orders Recorded (Live count).
  * **Village Activity Table**: Tracks visits, shops visited, and orders taken per village + **Add Village** modal.
  * **Salesperson Performance Table**: Tracks field status (Active/Inactive), visits, and orders taken.
  * **Recent Voice Orders**: Live incoming orders with direct link to details.
* **`/admin/orders`**: Full searchable and filterable orders table.
* **`/admin/orders/[id]`**: Detailed order inspection displaying the **exact recorded Marathi voice transcript**, shop information, and salesperson information.
* **`/admin/salespersons`**: Salesperson master management.
* **`/admin/villages`**: Village territory management.
* **`/admin/shops`**: Partner retailer shops directory with credit balance tracking.

---

## 🌐 Dual-Language Support
The application features a global language toggle (`[ मराठी | English ]`) accessible on all screens:
* **Salesperson Portal:** Defaults to **मराठी** (Marathi-first as per PRD), can toggle to English.
* **Admin Portal:** Defaults to **English**, can toggle to मराठी.

---

## 🛠️ Tech Stack & Architecture
* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS (Custom brand tokens: `#084826`, Emerald, Amber)
* **Icons:** Lucide React
* **Typography:** `Noto Sans Devanagari` (Marathi) & `Plus Jakarta Sans` (English)
* **State Management:** Reactive React Context (`AppContext.tsx`) with real-time order synchronization between Sales and Admin.

---

## 🐳 Handoff for Inveon Technologies DevOps & Backend Team
1. The entire front-end UI is modular and ready for Docker containerization (`Dockerfile`).
2. Authentication on `app/page.tsx` is encapsulated and ready to connect to `POST /api/auth/login`.
3. The Speech-to-Text handler on `app/sales/order/record/page.tsx` is prepared to interface with `POST /api/v1/voice/transcribe` (`@google-cloud/speech` with language code `mr-IN`).
