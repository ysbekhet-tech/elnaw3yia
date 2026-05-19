"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

export default function FloatingCart() {
  const { cartCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="fixed bottom-8 left-8 gradient-bg text-white w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30 pulse-glow"
      style={{ boxShadow: "0 8px 32px rgba(124,58,237,0.5)" }}
    >
      <ShoppingCart size={26} />
      {cartCount > 0 && (
        <span
          className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center"
          style={{ boxShadow: "0 0 12px rgba(236,72,153,0.6)" }}
        >
          {cartCount}
        </span>
      )}
    </button>
  );
}