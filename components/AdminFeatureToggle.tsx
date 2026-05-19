'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Product } from '@/types';
import { isAuthenticated } from '@/lib/auth';
import { ArrowRight, Loader2 } from 'lucide-react';

interface AdminFeatureToggleProps {
  title: string;
  icon: React.ReactNode;
  fieldName: 'isOffer' | 'isNew';
}

export default function AdminFeatureToggle({ title, icon, fieldName }: AdminFeatureToggleProps) {
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

  const handleToggle = async (productId: string, currentValue: boolean) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { [fieldName]: !currentValue });
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
    }
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/admin')} className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition font-bold text-sm mb-8">
          <ArrowRight size={18} /> العودة للوحة التحكم
        </button>

        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            {icon} {title}
          </h2>
          <p className="text-sm text-slate-400 mb-6">قم بتفعيل أو إلغاء ظهور المنتجات في هذا القسم عبر المفتاح بجانب كل منتج.</p>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-purple-400" size={30} />
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                // ✅ الحل: التأكد من وجود id قبل عرض العنصر
                if (!p.id) return null;

                return (
                  <div 
                    key={p.id} 
                    className="flex items-center justify-between p-4 rounded-xl transition"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800 text-xs text-slate-500 flex-shrink-0">صورة</div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.category} - جنيه {p.price}</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!p[fieldName]}
                        // ✅ استخدام p.id! عشان نقول للـ TypeScript إنها موجودة أكيد
                        onChange={() => handleToggle(p.id!, !!p[fieldName])}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                );
              })}
              {products.length === 0 && <p className="text-center text-slate-500 text-sm py-5">لا توجد منتجات بعد</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}