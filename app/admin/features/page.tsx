'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Product } from '@/types';
import { isAuthenticated } from '@/lib/auth';
import { ArrowRight, Loader2, Tag, Sparkles } from 'lucide-react';

export default function FeaturesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);

    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prodsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (productId: string, field: 'isOffer' | 'isNew', currentValue: boolean) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { [field]: !currentValue });
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
    }
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
      

        <div className="rounded-2xl p-6 bg-white border border-purple-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-2">
            <Tag size={20} className="text-yellow-500" />
            <Sparkles size={20} className="text-cyan-500" />
            إدارة العروض والمنتجات الجديدة
          </h2>
          <p className="text-sm text-slate-500 mb-6">قم بتفعيل أو إلغاء ظهور المنتج كـ "عرض خاص" أو "وصل حديثاً".</p>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-purple-600" size={30} />
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                if (!p.id) return null;

                return (
                  <div 
                    key={p.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl gap-4 bg-slate-50 border border-slate-200 hover:border-purple-200 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-slate-200 text-xs text-slate-500 flex-shrink-0">صورة</div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.category} - جنيه {p.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-yellow-600">عرض خاص</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!p.isOffer}
                            onChange={() => handleToggle(p.id!, 'isOffer', !!p.isOffer)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-600">وصل حديثاً</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!p.isNew}
                            onChange={() => handleToggle(p.id!, 'isNew', !!p.isNew)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && <p className="text-center text-slate-400 text-sm py-5">لا توجد منتجات بعد</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}