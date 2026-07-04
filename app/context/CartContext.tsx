"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Product, CartItem, ProductSize } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

type CartContextType = {
  cart: CartItem[];
  addToCart: (
    product: Product,
    openSidebar?: boolean,
    selectedColor?: string,
    qty?: number,
    selectedSize?: ProductSize
  ) => Promise<boolean>;
  removeFromCart: (id: string, selectedColor?: string, selectedSize?: ProductSize) => void;
  deleteFromCart: (id: string, selectedColor?: string, selectedSize?: ProductSize) => void;
  clearLocalCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  availableStock: (productId: string) => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_EXPIRY_MINUTES = 10;
const CART_EXPIRY_MS = CART_EXPIRY_MINUTES * 60 * 1000;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [productsData, setProductsData] = useState<Record<string, { stock: number; reserved: number }>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stationery-cart");
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        const now = Date.now();
        const validItems = parsed.filter((item) => now - item.addedAt < CART_EXPIRY_MS);
        setCart(validItems);
        
        const expiredItems = parsed.filter((item) => now - item.addedAt >= CART_EXPIRY_MS);
        expiredItems.forEach((item) => releaseReservation(item.id, item.quantity));
      }
    } catch {
      localStorage.removeItem("stationery-cart");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("stationery-cart", JSON.stringify(cart));
  }, [cart]);

  // استخدام IDs المنتجات الفريدة فقط لتجنب إنشاء snapshots متعددة لنفس المنتج
  const uniqueProductIds = [...new Set(cart.map((i) => i.id).filter(Boolean))];

  useEffect(() => {
    if (uniqueProductIds.length === 0) return;

    const unsubscribes = uniqueProductIds.map((itemId) => {
      if (!itemId) return () => {};
      return onSnapshot(doc(db, "products", itemId), (snap) => {
        if (snap.exists()) {
          setProductsData((prev) => ({
            ...prev,
            [itemId]: {
              stock: snap.data().stock || 0,
              reserved: snap.data().reserved || 0,
            },
          }));
        }
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [uniqueProductIds.join(",")]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      setCart((prev) => {
        const valid = prev.filter((item) => now - item.addedAt < CART_EXPIRY_MS);
        const expired = prev.filter((item) => now - item.addedAt >= CART_EXPIRY_MS);
        expired.forEach((item) => releaseReservation(item.id, item.quantity));
        return valid;
      });
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const availableStock = useCallback(
    (productId: string): number => {
      const data = productsData[productId];
      if (!data) return 0;
      
      const { stock, reserved } = data;
      const myReserved = cart
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const othersReserved = Math.max(0, reserved - myReserved);
      return Math.max(0, stock - othersReserved);
    },
    [productsData, cart]
  );

  const reserveStock = async (
    productId: string,
    newQty: number,
    oldQty: number = 0
  ): Promise<boolean> => {
    try {
      const ref = doc(db, "products", productId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return false;

      const currentStock = snap.data().stock || 0;
      const currentReserved = snap.data().reserved || 0;

      const adjustedReserved = Math.max(0, currentReserved - oldQty);
      const available = currentStock - adjustedReserved;

      if (available < newQty) {
        return false;
      }

      try {
        const qtyDiff = newQty - oldQty;
        await updateDoc(ref, {
          reserved: currentReserved + qtyDiff,
        });
      } catch (err) {
        console.warn("Could not reserve stock in Firestore (possibly due to permissions), but adding to cart anyway.", err);
      }
      
      return true;
    } catch (error) {
      console.error("Error checking stock:", error);
      return true; // الفشل في قراءة المخزون لا يمنع إضافة المنتج لتجنب حظر المستخدم
    }
  };

  const releaseReservation = async (productId: string | undefined, quantity: number) => {
    if (!productId) return;
    try {
      const ref = doc(db, "products", productId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const currentReserved = snap.data().reserved || 0;
      await updateDoc(ref, {
        reserved: Math.max(0, currentReserved - quantity),
      });
    } catch (error) {
      console.error("Error releasing reservation:", error);
    }
  };

  const getSizeKey = (size?: ProductSize) => {
    return size ? `${size.length}x${size.width}` : "";
  };

  const addToCart = useCallback(
    async (
      product: Product,
      openSidebar: boolean = true,
      selectedColor?: string,
      qty: number = 1,
      selectedSize?: ProductSize
    ): Promise<boolean> => {
      if (!product.id) return false;
      const colorKey = selectedColor || "";
      const sizeKey = getSizeKey(selectedSize);
      const now = Date.now();

      const existingItem = cart.find(
        (i) => i.id === product.id && (i.selectedColor || "") === colorKey && getSizeKey(i.selectedSize) === sizeKey
      );

      if (existingItem) {
        const newTotalQty = existingItem.quantity + qty;
        
        const reserved = await reserveStock(product.id, newTotalQty, existingItem.quantity);
        if (!reserved) {
          toast.error("نفذت الكمية المتاحة من هذا المنتج");
          return false;
        }

        setCart((prev) =>
          prev.map((i) =>
            i.id === product.id && (i.selectedColor || "") === colorKey && getSizeKey(i.selectedSize) === sizeKey
              ? { ...i, quantity: i.quantity + qty, addedAt: now }
              : i
          )
        );
      } else {
        const reserved = await reserveStock(product.id, qty, 0);
        if (!reserved) {
          toast.error("نفذت الكمية المتاحة من هذا المنتج");
          return false;
        }

        setCart((prev) => [
          ...prev,
          { ...product, quantity: qty, selectedColor: colorKey, selectedSize: selectedSize, addedAt: now },
        ]);
      }

      if (openSidebar) setIsCartOpen(true);
      return true;
    },
    [cart]
  );

  const removeFromCart = useCallback((id: string, selectedColor?: string, selectedSize?: ProductSize) => {
    const colorKey = selectedColor || "";
    const sizeKey = getSizeKey(selectedSize);
    
    setCart((prev) => {
      const item = prev.find((i) => i.id === id && (i.selectedColor || "") === colorKey && getSizeKey(i.selectedSize) === sizeKey);
      if (item) {
        releaseReservation(id, 1);
      }

      return prev
        .map((i) =>
          i.id === id && (i.selectedColor || "") === colorKey && getSizeKey(i.selectedSize) === sizeKey
            ? { ...i, quantity: i.quantity - 1, addedAt: Date.now() }
            : i
        )
        .filter((i) => i.quantity > 0);
    });
  }, []);

  const deleteFromCart = useCallback((id: string, selectedColor?: string, selectedSize?: ProductSize) => {
    const colorKey = selectedColor || "";
    const sizeKey = getSizeKey(selectedSize);
    
    setCart((prev) => {
      const item = prev.find((i) => i.id === id && (i.selectedColor || "") === colorKey && getSizeKey(i.selectedSize) === sizeKey);
      if (item) {
        releaseReservation(id, item.quantity);
      }
      return prev.filter((i) => !(i.id === id && (i.selectedColor || "") === colorKey && getSizeKey(i.selectedSize) === sizeKey));
    });
  }, []);

  const clearLocalCart = useCallback(() => {
    cart.forEach((item) => {
      releaseReservation(item.id, item.quantity);
    });
    setCart([]);
  }, [cart]);

  // ✅ إصلاح مهم: حساب السعر الإجمالي ليشمل سعر المقاس الإضافي
  const cartTotal = cart.reduce((t, i) => {
  const sizePrice = Number(i.selectedSize?.price) || 0;
  const finalItemPrice = sizePrice > 0 ? sizePrice : Number(i.price) || 0;
  return t + (finalItemPrice * i.quantity);
}, 0);

  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearLocalCart,
        cartTotal,
        cartCount,
        isCartOpen,
        openCart,
        closeCart,
        availableStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}