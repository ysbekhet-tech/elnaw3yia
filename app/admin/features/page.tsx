'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Product } from '@/types';
import { isAuthenticated } from '@/lib/auth';
import { Loader2, Tag, Sparkles, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PRODUCTS_PER_PAGE = 20;

export default function FeaturesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);

    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const prodsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(prodsList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleToggle = async (productId: string, field: 'isOffer' | 'isNew', currentValue: boolean) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { [field]: !currentValue });
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, [field]: !currentValue } : p
      ));
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
    }
  };

  // ✅ تصفية بالبحث
  const filtered = products.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.barcode?.includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  // ✅ حساب الصفحات
  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  // ✅ إعادة الصفحة للأولى عند تغيير البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ✅ دوال التنقل بين الصفحات
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ✅ إنشاء أرقام الصفحات
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
          <p className="text-sm text-slate-500 mb-6">قم بتفعيل أو إلغاء ظهور المنتج كـ &quot;عرض خاص&quot; أو &quot;وصل حديثاً&quot;.</p>

          {/* ✅ مستطيل البحث */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الباركود أو الفئة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pr-9 pl-3 rounded-xl text-sm outline-none bg-slate-50 border border-slate-200 focus:border-purple-400 text-black placeholder:text-slate-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-purple-600" size={30} />
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-slate-500 font-bold">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات بعد'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedProducts.map((p) => {
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
              </div>

              {/* ✅ Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
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

                  <span className="text-xs text-slate-400 font-bold mr-2">
                    {filtered.length} منتج - صفحة {currentPage} من {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}