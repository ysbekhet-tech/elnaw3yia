'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '@/types';
import { Sparkles, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard'; // ✅ استدعاء الكارت

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNew = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('isNew', '==', true));
        const snapshot = await getDocs(q);
        const newList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(newList);
      } catch (error) {
        console.error('خطأ في جلب المنتجات الجديدة:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNew();
  }, []);

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
        <div className="flex items-center gap-3 mb-8">
          <Sparkles size={30} className="text-cyan-400" />
          <h1 className="text-3xl font-black text-white">وصل حديثاً</h1>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">لا توجد منتجات جديدة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              // ✅ استخدام الكومبوننت مباشرة
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}