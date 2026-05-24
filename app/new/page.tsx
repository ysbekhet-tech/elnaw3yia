'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '@/types';
import { Sparkles, Loader2, Search, ChevronLeft, ChevronRight, LayoutGrid, Grid2x2, List } from 'lucide-react'; // ✅ إضافة أيقونات العرض
import ProductCard from '@/components/ProductCard';

const PRODUCTS_PER_PAGE = 20;

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid"); // ✅ حالة العرض

  useEffect(() => {
    const fetchNew = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, 'products'),
          where('isNew', '==', true)
        );
        const snapshot = await getDocs(q);

        const newList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.isActive !== false)
          .sort((a, b) => {
            // دالة آمنة لاستخراج الوقت
            const getTime = (dateVal: any) => {
              if (!dateVal) return 0;
              if (typeof dateVal.toMillis === 'function') return dateVal.toMillis();
              if (dateVal.seconds) return dateVal.seconds * 1000;
              if (dateVal instanceof Date) return dateVal.getTime();
              return new Date(dateVal).getTime() || 0;
            };

            const timeA = getTime(a.createdAt);
            const timeB = getTime(b.createdAt);
            return timeB - timeA;
          });

        setProducts(newList);
      } catch (error) {
        console.error('خطأ في جلب المنتجات الجديدة:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNew();
  }, []);

  useEffect(() => {
    let result = products;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.barcode?.toString().toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <Loader2 className="animate-spin text-cyan-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#050510" }}>
      <div className="max-w-7xl mx-auto">
        
        {/* ✅ تعديل الهيدر لإضافة أزرار تبديل العرض */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Sparkles size={30} className="text-cyan-400" />
            <h1 className="text-3xl font-black text-white">وصل حديثاً</h1>
            <span className="text-slate-500 text-sm">({filtered.length} منتج)</span>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 self-start sm:self-auto">
            <button 
              onClick={() => setViewMode("grid")} 
              className={`p-2.5 rounded-xl transition ${viewMode === "grid" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="عرض كروت كبيرة"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode("compact")} 
              className={`p-2.5 rounded-xl transition ${viewMode === "compact" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="عرض كروت صغيرة"
            >
              <Grid2x2 size={16} />
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`p-2.5 rounded-xl transition ${viewMode === "list" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="عرض قايمة"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative max-w-lg">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-9 pl-4 rounded-2xl text-sm outline-none bg-slate-800/50 border border-slate-700 focus:border-cyan-400 text-white placeholder:text-slate-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">✨</p>
            <p className="text-slate-400 text-lg font-bold">
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات جديدة حالياً'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-cyan-400 font-bold hover:underline"
              >
                عرض كل المنتجات الجديدة
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ✅ تحديث الشبكة (Grid) للتجاوب مع وضع العرض */}
            <div className={`grid gap-6 ${
              viewMode === "list" ? "grid-cols-1" : 
              viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : 
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}>
              {paginatedProducts.map((product) => {
                const available = (product.stock || 0) - ((product as any).reserved || 0);
                return (
                  <div key={product.id} className="relative">
                    {available <= 0 && (
                      <div className="absolute inset-0 z-10 bg-black/60 rounded-xl flex items-center justify-center pointer-events-none">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                          نفذت الكمية
                        </span>
                      </div>
                    )}
                    {/* ✅ تمرير وضع العرض لكارت المنتج */}
                    <ProductCard product={product} viewMode={viewMode} />
                  </div>
                );
              })}
            </div>

            {/* أزرار التنقل بين الصفحات (Pagination) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition ${
                    currentPage === 1
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-white bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  <ChevronRight size={16} />
                  السابق
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
                      currentPage === page
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition ${
                    currentPage === totalPages
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-white bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  التالي
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs text-slate-500 font-bold mr-2 hidden sm:inline">
                  صفحة {currentPage} من {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}