"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const productSnapshot = await getDocs(productsCollection);

        const productList = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        // ✅ تعديل إخفاء المنتج: بنفلتر النتيجة عشان نشيل اللي الـ active بتاعها false
        const visibleProducts = productList.filter(p => p.isActive !== false);

        setProducts(visibleProducts);
      } catch (error) {
        console.error("حصل خطأ في جلب المنتجات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full gradient-bg animate-spin opacity-80" style={{ borderTop: "3px solid transparent" }} />
          <p className="text-lg text-slate-500 font-bold">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-5 py-16">

      {/* Section Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="gradient-text font-bold mb-2 text-sm">منتجات مختارة</p>
          <h2 className="text-4xl font-black text-white">
            الأكثر مبيعًا
          </h2>
          <div className="w-16 h-1 rounded-full gradient-bg mt-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-6xl mb-4">📦</p>
            <p className="text-slate-500 font-bold text-lg">لا توجد منتجات حالياً</p>
          </div>
        )}
      </div>

    </section>
  );
}