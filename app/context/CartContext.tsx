"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { Product } from "@/types";

type CartItem = Product & { quantity: number; selectedColor?: string; reservedAt?: number };

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product, openSidebar?: boolean, selectedColor?: string, qty?: number) => Promise<boolean>;
  removeFromCart: (id: string, selectedColor?: string) => Promise<void>;
  deleteFromCart: (id: string, selectedColor?: string) => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const RESERVATION_MINUTES = 15;
const RESERVATION_MS = RESERVATION_MINUTES * 60 * 1000;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const safeReleaseReserved = async (productId: string, qtyToRelease: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "products", productId);
        const snap = await transaction.get(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        const currentReserved = data?.reserved || 0;
        const actualRelease = Math.min(qtyToRelease, Math.max(0, currentReserved));

        if (actualRelease > 0) {
          transaction.update(ref, { reserved: increment(-actualRelease) });
          console.log("Released:", actualRelease, "from reserved. Was:", currentReserved);
        } else {
          console.log("Nothing to release. reserved was:", currentReserved);
        }
      });
    } catch (e) {
      console.error("Failed to release reservation:", e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("stationery-cart");
    if (saved) {
      try {
        const parsed: CartItem[] = JSON.parse(saved);
        const now = Date.now();
        const valid: CartItem[] = [];
        const expired: CartItem[] = [];

        parsed.forEach((item) => {
          if (!item.id) return;
          if (!item.reservedAt || now - item.reservedAt < RESERVATION_MS) {
            valid.push(item);
          } else {
            expired.push(item);
          }
        });

        expired.forEach((item) => {
          if (!item.id) return;
          safeReleaseReserved(item.id, item.quantity);
        });

        setCart(valid);
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem("stationery-cart");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("stationery-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expired = cart.filter(
        (item) => item.id && item.reservedAt && now - item.reservedAt >= RESERVATION_MS
      );

      if (expired.length > 0) {
        expired.forEach((item) => {
          if (!item.id) return;
          safeReleaseReserved(item.id, item.quantity);
        });

        setCart((prev) =>
          prev.filter(
            (item) =>
              !(item.id && item.reservedAt && now - item.reservedAt >= RESERVATION_MS)
          )
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cart]);

  const addToCart = useCallback(
    async (
      product: Product,
      openSidebar: boolean = true,
      selectedColor?: string,
      qty: number = 1
    ): Promise<boolean> => {
      if (qty <= 0) return false;
      if (!product.id) {
        console.error("Product has no ID");
        return false;
      }

      try {
        await runTransaction(db, async (transaction) => {
          // Fix: إضافة تحقق للتأكد من وجود ID المنتج قبل استخدامه في الـ Transaction
          if (!product.id) return;

          const ref = doc(db, "products", product.id);
          const snap = await transaction.get(ref);
          if (!snap.exists()) throw new Error("المنتج غير موجود");

          const data = snap.data();
          const stock = data.stock || 0;
          const reserved = data.reserved || 0;

          if (stock - reserved < qty) {
            throw new Error("نفذت الكمية");
          }

          transaction.update(ref, { reserved: increment(qty) });
        });

        const now = Date.now();

        setCart((prev) => {
          const exists = prev.find(
            (i) => i.id === product.id && i.selectedColor === selectedColor
          );
          if (exists) {
            return prev.map((i) =>
              i.id === product.id && i.selectedColor === selectedColor
                ? { ...i, quantity: i.quantity + qty, reservedAt: now }
                : i
            );
          }
          return [
            ...prev,
            { ...product, quantity: qty, selectedColor, reservedAt: now },
          ];
        });

        if (openSidebar) setIsCartOpen(true);
        return true;
      } catch (error) {
        console.error("addToCart failed:", error);
        return false;
      }
    },
    []
  );

  const removeFromCart = useCallback(
    async (id: string, selectedColor?: string) => {
      const item = cart.find(
        (i) => i.id === id && i.selectedColor === selectedColor
      );
      if (!item) return;

      await safeReleaseReserved(id, 1);

      setCart((prev) => {
        const target = prev.find(
          (i) => i.id === id && i.selectedColor === selectedColor
        );
        if (!target) return prev;

        if (target.quantity > 1) {
          return prev.map((i) =>
            i.id === id && i.selectedColor === selectedColor
              ? { ...i, quantity: i.quantity - 1 }
              : i
          );
        }
        return prev.filter(
          (i) => !(i.id === id && i.selectedColor === selectedColor)
        );
      });
    },
    [cart]
  );

  const deleteFromCart = useCallback(
    async (id: string, selectedColor?: string) => {
      const item = cart.find(
        (i) => i.id === id && i.selectedColor === selectedColor
      );
      if (!item) return;

      await safeReleaseReserved(id, item.quantity);

      setCart((prev) =>
        prev.filter(
          (i) => !(i.id === id && i.selectedColor === selectedColor)
        )
      );
    },
    [cart]
  );

  const cartTotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const cartCount = cart.reduce((c, i) => c + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        deleteFromCart,
        cartTotal,
        cartCount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }

  return ctx;
}