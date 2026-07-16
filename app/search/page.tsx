"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { Search, PackageOpen, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";

const RESULTS_PER_PAGE = 30;

function SearchContent() {
  const searchParams = useSearchParams();
  const query_ = searchParams.get("q") || "";

  const [allResults, setAllResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (query_.trim()) {
      fetchResults(query_.trim());
    } else {
      setAllResults([]);
      setLoading(false);
    }
    setCurrentPage(1);
  }, [query_]);

  const fetchResults = async (searchTerm: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        where("isActive", "!=", false)
      );
      const snapshot = await getDocs(q);

      const allProducts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );

      const lowerSearch = searchTerm.toLowerCase();
      const filtered = allProducts.filter((p) =>
        p.name?.toLowerCase().includes(lowerSearch) ||
        p.category?.toLowerCase().includes(lowerSearch) ||
        p.description?.toLowerCase().includes(lowerSearch)
      );

      setAllResults(filtered);
    } catch (error) {
      console.error("Error searching:", error);
      setAllResults([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(allResults.length / RESULTS_PER_PAGE);
  const currentResults = allResults.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const maxVisible = 5;
    const pages = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisible + 1;
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* عنوان البحث */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Search size={28} className="text-purple-400" />
            نتائج البحث عن: <span className="gradient-text">&quot;{query_}&quot;</span>
          </h1>
          <p className="text-slate-500 mt-2">
            {loading ? "جاري البحث..." : `تم العثور على ${allResults.length} منتج`}
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
        ) : !query_.trim() ? (
          <div className="text-center py-20">
            <Search size={64} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">ابحث عن منتجاتك المفضلة</h2>
            <p className="text-slate-500">استخدم شريط البحث أعلاه للعثور على ما تريد</p>
          </div>
        ) : allResults.length === 0 ? (
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
          <>
            {/* عرض النتائج باستخدام ProductCard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentResults.map((product) => {
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

            {/* الترقيم (Pagination) */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition ${
                    currentPage === 1
                      ? "text-slate-700 cursor-not-allowed"
                      : "text-slate-300 hover:bg-purple-500/10 hover:text-purple-400"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                      currentPage === page
                        ? "gradient-bg text-white"
                        : "text-slate-300 hover:bg-purple-500/10 hover:text-purple-400"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition ${
                    currentPage === totalPages
                      ? "text-slate-700 cursor-not-allowed"
                      : "text-slate-300 hover:bg-purple-500/10 hover:text-purple-400"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="text-xs text-slate-500 font-bold mr-2 w-full text-center sm:w-auto sm:text-start mt-2 sm:mt-0">
                  {allResults.length} منتج - صفحة {currentPage} من {totalPages}
                </span>
              </div>
            )}
          </>
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