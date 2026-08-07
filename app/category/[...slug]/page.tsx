"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import {
  ArrowUpDown, Search, LayoutGrid, Grid2x2, List,
  Loader2, ChevronRight, ChevronLeft, X
} from "lucide-react";

const PRODUCTS_PER_PAGE = 20;

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = Array.isArray(params.slug) ? params.slug.join("/") : (params.slug ?? "");
  const categoryName = decodeURIComponent(rawSlug);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // فلاتر
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");

  // تصفح الصفحات
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", categoryName)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(list);
      } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) fetchProducts();
  }, [categoryName]);

  // ١. تصفية بالبحث أولاً
  const searched = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  // ٢. ترتيب
  const sorted = useMemo(() => {
    const items = [...searched];
    switch (sortBy) {
      case "price_asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "name_az":
        items.sort((a, b) => a.name.localeCompare(b.name, "ar"));
        break;
      case "newest":
        items.sort((a, b) => {
          const aT = (a as any).createdAt?.seconds || 0;
          const bT = (b as any).createdAt?.seconds || 0;
          return bT - aT;
        });
        break;
      default:
        break;
    }
    return items;
  }, [searched, sortBy]);

  // ٣. تقسيم الصفحات
  const totalPages = Math.ceil(sorted.length / PRODUCTS_PER_PAGE);
  const paginated = sorted.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // عند تغيير البحث أو الترتيب، ارجع للصفحة الأولى
  useEffect(() => setCurrentPage(1), [search, sortBy]);

  const getPageNumbers = () => {
    const max = 5;
    if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = start + max - 1;
    if (end > totalPages) { end = totalPages; start = end - max + 1; }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-purple-600 mb-3" size={40} />
          <p className="text-slate-500 font-bold">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 bg-white min-h-screen">

      {/* ── الهيدر ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 gradient-bg rounded" />
        <h1 className="text-3xl font-black text-slate-800">{categoryName}</h1>
        <span className="text-slate-400 text-sm">({sorted.length} منتج)</span>
      </div>

      {/* ── شريط الأدوات: بحث + ترتيب + عرض ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">

        {/* بحث */}
        <div className="flex items-center flex-1 max-w-lg bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-2.5 gap-2">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={`ابحث في ${categoryName}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-700">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ترتيب */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl px-3 py-2">
          <ArrowUpDown size={14} className="text-purple-600 flex-shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-sm text-slate-700 font-semibold outline-none cursor-pointer"
          >
            <option value="default">الترتيب الافتراضي</option>
            <option value="newest">الأحدث أولاً</option>
            <option value="price_asc">السعر: من الأرخص للأغلى</option>
            <option value="price_desc">السعر: من الأغلى للأرخص</option>
            <option value="name_az">الاسم: أبجدي (أ - ي)</option>
          </select>
        </div>

        {/* طريقة العرض */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-1.5 self-start sm:self-auto">
          {(["grid", "compact", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2.5 rounded-xl transition ${viewMode === mode ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-800"}`}
              title={mode === "grid" ? "كروت كبيرة" : mode === "compact" ? "كروت صغيرة" : "قائمة"}
            >
              {mode === "grid" ? <LayoutGrid size={16} /> : mode === "compact" ? <Grid2x2 size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── المنتجات ── */}
      {sorted.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">{search ? "🔍" : "📦"}</p>
          <p className="text-xl font-black text-slate-700 mb-2">
            {search ? `لا توجد نتائج لـ "${search}"` : "لا توجد منتجات في هذا القسم"}
          </p>
          <p className="text-slate-500 mb-4">
            {search ? "جرب بحث بكلمة تانية" : "سيتم إضافة منتجات قريباً"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-purple-600 font-bold hover:underline"
            >
              عرض كل منتجات {categoryName}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`grid gap-4 ${
            viewMode === "list"    ? "grid-cols-1" :
            viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" :
                                     "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}>
            {paginated.map((product) => {
              const available = (product.stock || 0) - ((product as any).reserved || 0);
              return (
                <div key={product.id} className="relative">
                  {available <= 0 && (
                    <div className="absolute inset-0 z-10 bg-black/60 rounded-xl flex items-center justify-center pointer-events-none">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">نفذت الكمية</span>
                    </div>
                  )}
                  <ProductCard product={product} viewMode={viewMode} />
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition ${currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"}`}
              >
                <ChevronRight size={18} />
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition ${currentPage === page ? "gradient-bg text-white" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition ${currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"}`}
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-xs text-slate-400 font-bold w-full text-center mt-1 sm:w-auto sm:mt-0">
                {sorted.length} منتج · صفحة {currentPage} من {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}