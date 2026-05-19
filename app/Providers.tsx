"use client";

import { CartProvider } from "./context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import FloatingCart from "@/components/FloatingCart";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
      <FloatingCart />
    </CartProvider>
  );
}