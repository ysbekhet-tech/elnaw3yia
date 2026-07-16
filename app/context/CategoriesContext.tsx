"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ تعريف نوع الكاتيجوري
export interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

type CategoriesContextType = {
  categories: Category[];
};

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
});

/**
 * CategoriesProvider
 * يفتح onSnapshot واحد فقط على collection الأقسام
 * ويشارك البيانات مع كل الـ components (Navbar + CategoriesSection + ...)
 * بدل ما كل component يفتح listener مستقل
 */
export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // ✅ listener واحد فقط طول عمر الـ app
    const unsubscribe = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const catsList = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Category)
        );
        setCategories(catsList);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
