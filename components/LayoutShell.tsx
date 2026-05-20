"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // لو الرابط فيه /admin، يبقى احنا في لوحة التحكم ونخفي الـ Navbar والـ Footer
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {/* هيتظه بس لو مش في صفحات الأدمن */}
      {!isAdmin && <AdBanner />}
      {!isAdmin && <Navbar />}

      <main className="min-h-screen">
        {children}
      </main>

      {/* هيتظه بس لو مش في صفحات الأدمن */}
      {!isAdmin && <Footer />}
    </>
  );
}