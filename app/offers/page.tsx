'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '@/types';
import { Tag, Loader2, LayoutGrid, Grid2x2, List } from 'lucide-react'; // ✅ استيراد الأيقونات
import ProductCard from '@/components/ProductCard'; 

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid"); // ✅ حالة العرض

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
        
        {/* ✅ تعديل الهيدر عشان نضيف الزرارات جنب العنوان */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Tag size={30} className="text-yellow-400" />
            <h1 className="text-3xl font-black text-white">العروض والتخفيضات</h1>
          </div>

          {/* ✅ زرارات التبديل (ألوان داكنة تناسب التصميم) */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 self-start">
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

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">لا توجد عروض متاحة حالياً</p>
          </div>
        ) : (
          // ✅ تعديل الـ Grid بناءً على نوع العرض
          <div className={`grid gap-6 ${
            viewMode === "list" ? "grid-cols-1" : 
            viewMode === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : 
            "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}