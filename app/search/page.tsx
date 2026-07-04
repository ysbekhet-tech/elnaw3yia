"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { Search, PackageOpen, ArrowRight } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* عنوان البحث */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Search size={28} className="text-purple-400" />
            نتائج البحث عن: <span className="gradient-text">&quot;{query}&quot;</span>
          </h1>
          <p className="text-slate-500 mt-2">
            {loading ? "جاري البحث..." : `تم العثور على ${results.length} منتج`}
          </p>
        </div>

        {/* حالة التحميل */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className="w-12 h-12 rounded-full animate-spin"
              style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }}
            />
          </div>
        ) : !query.trim() ? (
          <div className="text-center py-20">
            <Search size={64} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">ابحث عن منتجاتك المفضلة</h2>
            <p className="text-slate-500">استخدم شريط البحث أعلاه للعثور على ما تريد</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <PackageOpen size={64} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">مفيش نتائج</h2>
            <p className="text-slate-500 mb-6">جرب تدور بكلمة تانية أو تصفح الأقسام</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 gradient-bg px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition"
            >
              <span>تصفح جميع المنتجات</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          /* عرض النتائج باستخدام ProductCard */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((product) => {
              const available = (product.stock || 0) - ((product as any).reserved || 0);
              return (
                <div key={product.id} className="relative">
                  {available <= 0 && (
                    <div className="absolute inset-0 z-10 bg-black/60 rounded-xl flex items-center justify-center pointer-events-none">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">نفذت الكمية</span>
                    </div>
                  )}
                  <ProductCard product={product} viewMode="grid" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }}
          />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}