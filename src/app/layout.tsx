import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "sonner";
import NumeralNormalizer from "@/components/NumeralNormalizer";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "TajirZone Platform",
  description: "Advanced multi-tenant SaaS for merchants",
};

import QueryProvider from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} antialiased font-sans flex flex-col min-h-screen`} suppressHydrationWarning>
        <NumeralNormalizer />
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
