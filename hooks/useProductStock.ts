"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useProductStock(productId: string | undefined) {
  const [stock, setStock] = useState<number>(0);
  const [reserved, setReserved] = useState<number>(0);

  useEffect(() => {
    if (!productId) return;
    
    const unsub = onSnapshot(doc(db, "products", productId), (snap) => {
      if (snap.exists()) {
        setStock(snap.data().stock || 0);
        setReserved(snap.data().reserved || 0);
      }
    });

    return () => unsub();
  }, [productId]);

  return { stock, reserved };
}