"use client";

import { useEffect, useState, Suspense, useCallback } from "react"; 
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { LayoutGrid, Grid2x2, List, Loader2, ChevronRight, ChevronLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

const PRODUCTS_PER_PAGE = 21;

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const categoryFromUrl = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    } else {
      setActiveCategory("الكل");
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      const catsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(catsList);
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        where("isActive", "!=", false)
      );
      const snapshot = await getDocs(q);
      
      const newProducts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setAllProducts(newProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let result = allProducts;
    if (activeCategory !== "الكل") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
    setCurrentPage(1);
  }, [activeCategory, search, allProducts]);

  const handleCategoryClick = (catName: string) => {
    setActiveCategory(catName);
    const newUrl = catName === "الكل" ? "/products" : `/products?category=${catName}`;
    window.history.pushState({}, '', newUrl);
  };

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const currentProducts = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // دالة محدثة لعرض 5 صفحات فقط كحد أقصى
  const getPageNumbers = () => {
    const maxVisible = 5;
    const pages = [];
    
    // لو عدد الصفحات الكلي أقل من أو يساوي 5، اعرضهم كلهم
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // حساب بداية ونهاية النافذة المتحركة
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    // لو النهاية عدت عدد الصفحات الكلي، نرجع النافذة لورا
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisible + 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      
      {/* العنوان */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-purple-500 rounded"></div>
        <h1 className="text-3xl font-black text-slate-800">كل المنتجات</h1>
        <span className="text-slate-400 text-sm">({filtered.length} منتج)</span>
      </div>

      {/* البحث وطريقة العرض */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center flex-1 max-w-lg bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3">
          <span className="text-slate-400 ms-2">🔍</span>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500 me-2"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 self-start sm:self-auto">
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

      {/* الأقسام للموبايل (شريط أفقي قابل للتمرير) */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        <button
          onClick={() => handleCategoryClick("الكل")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex-shrink-0 ${
            activeCategory === "الكل"
              ? "bg-purple-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-purple-50"
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.name)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              activeCategory === cat.name
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-purple-50"
            }`}
          >
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <span>{cat.icon}</span>
            )}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* التخطيط الرئيسي: Sidebar + المنتجات */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar للأقسام (يظهر فقط على الشاشات الكبيرة) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl shadow-sm max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            
            {/* عنوان الأقسام - ثابت لا يتحرك */}
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-black text-slate-800">الأقسام</h3>
            </div>

            {/* قائمة الأقسام - هي اللي بينزل Scroll */}
            <div className="flex flex-col gap-2 p-4 overflow-y-auto">
              <button
                onClick={() => handleCategoryClick("الكل")}
                className={`w-full text-start px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${
                  activeCategory === "الكل"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                    : "bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                <span>🌐</span>
                <span>الكل</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`w-full text-start px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${
                    activeCategory === cat.name
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span>{cat.icon}</span>
                  )}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* قسم عرض المنتجات */}
        <main className="flex-1">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="animate-spin mx-auto text-purple-500 mb-4" size={40} />
              <p className="text-xl text-slate-500 font-bold">جاري تحميل المنتجات...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">📦</p>
              <p className="text-xl font-bold text-slate-500">لا توجد منتجات</p>
              <button
                onClick={() => { handleCategoryClick("الكل"); setSearch(""); }}
                className="mt-4 text-purple-600 font-bold hover:underline"
              >
                عرض كل المنتجات
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${
                viewMode === "list" ? "grid-cols-1" : 
                viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : 
                "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
              }`}>
                {currentProducts.map((product) => {
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

              {/* الترقيم (Pagination) */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition ${
                      currentPage === 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
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
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
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
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="text-xs text-slate-400 font-bold me-2 w-full text-center sm:w-auto sm:text-start mt-2 sm:mt-0">
                    {filtered.length} منتج - صفحة {currentPage} من {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10 flex justify-center items-center h-96">
          <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}