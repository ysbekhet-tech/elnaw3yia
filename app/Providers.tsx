"use client";

import dynamic from "next/dynamic";
import { CartProvider } from "./context/CartContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { ProductModalProvider } from "./context/ProductModalContext";
import FloatingCart from "@/components/FloatingCart";

// ✅ Lazy load للـ CartDrawer: مش هيتحمّل في الـ bundle الأولي
// ومش محتاج SSR لأنه client-only UI
const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // ✅ CategoriesProvider في الخارج عشان Navbar و CategoriesSection
    //    يستخدموا نفس الـ listener من غير ما يفتحوا listeners منفصلين
    <CategoriesProvider>
      <CartProvider>
        {/* ✅ ProductModalProvider يعرض modal واحد بدل modal لكل ProductCard */}
        <ProductModalProvider>
          {children}
          <CartDrawer />
          <FloatingCart />
        </ProductModalProvider>
      </CartProvider>
    </CategoriesProvider>
  );
}