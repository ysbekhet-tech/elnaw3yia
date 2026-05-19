"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";
import { Search, PackageOpen } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // الكلمة اللي بحث عنها

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
      // ١. نجيب كل المنتجات من الفايربيس
      const snap = await getDocs(collection(db, "products"));
      const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

      // ٢. نفلترهم بناءً على كلمة البحث (بغض النظر عن الحروف الكبيرة/الصغيرة)
      const filtered = allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      );

      setResults(filtered);
    } catch (error) {
      console.error("Error searching:", error);
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
            نتائج البحث عن: <span className="gradient-text">"{query}"</span>
          </h1>
          <p className="text-slate-500 mt-2">
            {loading ? "جاري البحث..." : `تم العثور على ${results.length} منتج`}
          </p>
        </div>

        {/* حالة التحميل */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-full animate-spin" style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }} />
          </div>
        ) : results.length === 0 ? (
          // حالة عدم وجود نتائج
          <div className="text-center py-20">
            <PackageOpen size={64} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">مفيش نتائج</h2>
            <p className="text-slate-500">جرب تدور بكلمة تانية أو تصفح الأقسام</p>
            <Link href="/" className="inline-block mt-6 gradient-bg px-6 py-2 rounded-xl text-white font-bold hover:opacity-90 transition">
              العودة للرئيسية
            </Link>
          </div>
        ) : (
          // عرض النتائج في Grid
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group rounded-2xl overflow-hidden transition hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <div className="aspect-square overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <img
                    src={product.image || "https://via.placeholder.com/300"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-400">{product.price} ج</span>
                    {product.stock > 0 ? (
                      <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded-lg">متوفر</span>
                    ) : (
                      <span className="text-[10px] text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded-lg">نفذ</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}