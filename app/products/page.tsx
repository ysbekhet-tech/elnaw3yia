"use client";

import { useEffect, useState, Suspense } from "react"; 
import { useSearchParams, useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { LayoutGrid, Grid2x2, List } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const categoryFromUrl = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");

  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    } else {
      setActiveCategory("الكل");
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const catsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(catsList);
      }
    );

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(list);
        setLoading(false);
      }
    );

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  useEffect(() => {
    let result = products.filter((p) => p.isActive !== false);

    if (activeCategory !== "الكل") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [activeCategory, search, products]);

  const handleCategoryClick = (catName: string) => {
    setActiveCategory(catName);
    if (catName === "الكل") {
      router.push("/products");
    } else {
      router.push(`/products?category=${catName}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-purple-500 rounded"></div>
        <h1 className="text-3xl font-black text-slate-800">كل المنتجات</h1>
        <span className="text-slate-400 text-sm">({filtered.length} منتج)</span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        
        <div className="flex items-center flex-1 max-w-lg bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3">
          <span className="text-slate-400 ml-2">🔍</span>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500"
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

      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => handleCategoryClick("الكل")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
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
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
              activeCategory === cat.name
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-purple-50"
            }`}
          >
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span>{cat.icon}</span>
            )}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
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
        <div className={`grid gap-4 ${
          viewMode === "list" ? "grid-cols-1" : 
          viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : 
          "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}>
          {filtered.map((product) => {
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
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10 flex justify-center items-center h-96">
          <p className="text-xl text-slate-500 font-bold">جاري التحميل...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}