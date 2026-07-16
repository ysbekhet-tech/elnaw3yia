"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { Product } from "@/types";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Grid2x2, List } from "lucide-react";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ✅ التحسين الرئيسي:
        // 1. where("isActive", "!=", false) → نفلتر في Firestore مش في JS
        // 2. limit(12) → نجيب 12 فقط من الـ DB مش كل المنتجات
        // النتيجة: قدر من الـ reads بيتوفر بشكل كبير
        const q = query(
          collection(db, "products"),
          where("isActive", "!=", false),
          limit(12)
        );
        const productSnapshot = await getDocs(q);

        const productList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setProducts(productList);
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

      {/* Section Header مع زرارات التبديل */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="gradient-text font-bold mb-2 text-sm">منتجات مختارة</p>
          <h2 className="text-4xl font-black text-white">
            الأكثر مبيعًا
          </h2>
          <div className="w-16 h-1 rounded-full gradient-bg mt-3" />
        </div>

        {/* زرارات تغيير العرض */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-xl transition ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="عرض كروت كبيرة"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`p-2.5 rounded-xl transition ${viewMode === "compact" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="عرض كروت صغيرة"
          >
            <Grid2x2 size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-xl transition ${viewMode === "list" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="عرض قايمة"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Grid المنتجات */}
      <div className={`grid gap-6 ${
        viewMode === "list" ? "grid-cols-1" :
        viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" :
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      }`}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-6xl mb-4">📦</p>
            <p className="text-slate-500 font-bold text-lg">لا توجد منتجات حالياً</p>
          </div>
        )}
      </div>

      {/* زرار عرض باقي المنتجات */}
      <div className="mt-12 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          عرض جميع المنتجات
          <ArrowLeft size={18} />
        </Link>
      </div>

    </section>
  );
}