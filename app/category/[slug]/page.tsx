"use client";

import { useEffect, useState, useMemo } from "react"; // ← ضفنا useMemo
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { ArrowUpDown } from "lucide-react"; // ← ضفنا الأيقونة

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default"); // ← ١. حالة الترتيب

  const categoryName = decodeURIComponent(slug as string);

  useEffect(() => {
    const fetchProducts = async () => {
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

  // ← ٢. دالة الترتيب الذكية (بتشتغل تلقائي لما المنتجات أو طريقة الترتيب تتغير)
  const sortedProducts = useMemo(() => {
    let items = [...products];

    switch (sortBy) {
      case "price_asc": // من الأرخص للأغلى
        items.sort((a, b) => a.price - b.price);
        break;
      case "price_desc": // من الأغلى للأرخص
        items.sort((a, b) => b.price - a.price);
        break;
      case "name_az": // الاسم أبجدي
        items.sort((a, b) => a.name.localeCompare(b.name, "ar"));
        break;
      default:
        // الترتيب الافتراضي (زي ما هي جاية من الداتابيز)
        break;
    }

    return items;
  }, [products, sortBy]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }} />
        </div>
        <p className="text-xl text-slate-500 font-bold">جاري تحميل المنتجات...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      
      {/* ← ٣. تعديل الهيدر عشان نحط جواه الترتيب */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        
        {/* الجزء اليمين (العنوان) */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 gradient-bg rounded"></div>
          <h1 className="text-3xl font-black text-white">{categoryName}</h1>
          <span className="text-slate-500 text-sm">({sortedProducts.length} منتج)</span>
        </div>

        {/* الجزء الشمال (الترتيب) */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-purple-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 transition cursor-pointer font-bold"
          >
            <option value="default" className="bg-slate-800">الترتيب الافتراضي</option>
            <option value="price_asc" className="bg-slate-800">السعر: من الأرخص للأغلى</option>
            <option value="price_desc" className="bg-slate-800">السعر: من الأغلى للأرخص</option>
            <option value="name_az" className="bg-slate-800">الاسم: أبجدي (أ - ي)</option>
          </select>
        </div>
        
      </div>

      {/* حالة مفيش منتجات */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-xl font-bold text-slate-400">لا توجد منتجات في هذا القسم</p>
          <p className="text-slate-600 mt-2">سيتم إضافة منتجات قريباً</p>
        </div>
      ) : (
        /* ← ٤. استخدمنا sortedProducts بدل products في الـ Map */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}