'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '@/types';
import { Tag, Loader2, LayoutGrid, Grid2x2, List, Search } from 'lucide-react'; // ✅ تم إضافة أيقونة Search
import ProductCard from '@/components/ProductCard'; 

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]); // ✅ حالة المنتجات المفلترة
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ حالة كلمة البحث
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");

  // جلب البيانات من فايربيز
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('isOffer', '==', true));
        const snapshot = await getDocs(q);
        
        const offersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
                                       .filter(p => p.isActive !== false);
                                       
        setProducts(offersList);
      } catch (error) {
        console.error('خطأ في جلب العروض:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // ✅ تطبيق فلتر البحث عندما تتغير المنتجات أو كلمة البحث
  useEffect(() => {
    let result = products;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.barcode?.toString().toLowerCase().includes(term) || // حماية الباركود كما فعلنا في الجديد
        p.category?.toLowerCase().includes(term)
      );
    }

    setFiltered(result);
  }, [searchTerm, products]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <Loader2 className="animate-spin text-purple-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#050510" }}>
      <div className="max-w-7xl mx-auto">
        
        {/* ✅ الهيدر مع أزرار العرض وعدد المنتجات */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Tag size={30} className="text-yellow-400" />
            <h1 className="text-3xl font-black text-white">العروض والتخفيضات</h1>
            <span className="text-slate-500 text-sm">({filtered.length} منتج)</span>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 self-start sm:self-auto">
            <button 
              onClick={() => setViewMode("grid")} 
              className={`p-2.5 rounded-xl transition ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="عرض كروت كبيرة"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode("compact")} 
              className={`p-2.5 rounded-xl transition ${viewMode === "compact" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="عرض كروت صغيرة"
            >
              <Grid2x2 size={16} />
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`p-2.5 rounded-xl transition ${viewMode === "list" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="عرض قايمة"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ✅ مستطيل البحث (نفس تصميم صفحة الجديد مع تغيير اللون للبنفسجي ليناسب العروض) */}
        <div className="mb-8">
          <div className="relative max-w-lg">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث في العروض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-9 pl-4 rounded-2xl text-sm outline-none bg-slate-800/50 border border-slate-700 focus:border-purple-400 text-white placeholder:text-slate-500 transition"
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
            <p className="text-5xl mb-4">{searchTerm ? '🔍' : '🏷️'}</p>
            <p className="text-slate-400 text-lg font-bold">
              {searchTerm ? 'لا توجد نتائج للبحث في العروض' : 'لا توجد عروض متاحة حالياً'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-purple-400 font-bold hover:underline"
              >
                عرض كل التخفيضات
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "list" ? "grid-cols-1" : 
            viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : 
            "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}>
            {/* ✅ استخدام filtered بدلاً من products */}
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}