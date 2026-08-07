import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Providers from "./Providers";
import LayoutShell from "@/components/LayoutShell";
import { Toaster } from "react-hot-toast";

// ✅ next/font/google: يحمّل الخط مع الـ build ويعمله self-hosting تلقائي
// بدل الـ CSS @import اللي كان يعمل blocking request في وقت التحميل
const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "STATIONERY STORE",
  description: "أفضل مكتبة لبيع الأدوات المكتبية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" className={cairo.variable}>
      <body className={cairo.className}>
        <Providers>
          <LayoutShell>
            {children}
          </LayoutShell>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "var(--font-cairo), sans-serif",
                fontSize: "14px",
                background: "#ffffff",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#1e293b",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              },
              success: {
                style: {
                  background: "#ffffff",
                  border: "1px solid rgba(34, 197, 94, 0.4)",
                  color: "#15803d",
                },
              },
              error: {
                style: {
                  background: "#ffffff",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#b91c1c",
                },
              },
            }}
          />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}