import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Jain Distributor, Pandharpur - Sales Field Management System",
  description: "Field order collection and distribution operations management system for Jain Distributor, Pandharpur. Powered by Inveon Technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#f7faf8] text-slate-800">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
