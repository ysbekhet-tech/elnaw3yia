"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [search, setSearch] = useState("");

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
    let result = products;
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-purple-500 rounded"></div>
        <h1 className="text-3xl font-black text-slate-800">
          كل المنتجات
        </h1>
        <span className="text-slate-400 text-sm">
          ({filtered.length} منتج)
        </span>
      </div>

      <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 mb-6 max-w-lg">
        <span className="text-slate-400 ml-2">🔍</span>
        <input
          type="text"
          placeholder="ابحث عن منتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-700"
        />
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
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span>{cat.icon}</span>
            )}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-xl text-slate-500 font-bold">
            جاري تحميل المنتجات...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-xl font-bold text-slate-500">
            لا توجد منتجات
          </p>
          <button
            onClick={() => {
              handleCategoryClick("الكل");
              setSearch("");
            }}
            className="mt-4 text-purple-600 font-bold hover:underline"
          >
            عرض كل المنتجات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => {
            const available =
              (product.stock || 0) -
              ((product as any).reserved || 0);
            return (
              <div key={product.id} className="relative">
                {available <= 0 && (
                  <div className="absolute inset-0 z-10 bg-black/60 rounded-xl flex items-center justify-center pointer-events-none">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      نفذت الكمية
                    </span>
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}