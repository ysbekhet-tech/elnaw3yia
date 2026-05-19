'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Product } from '@/types';
import AdminProductTable from '@/components/AdminProductTable';
import AdminProductForm from '@/components/AdminProductForm';
import AdminPriceEditor from '@/components/AdminPriceEditor';
import { isAuthenticated } from '@/lib/auth';
import { Package, Plus, X, Upload, Tags, ArrowRight, ArrowUpDown, Filter } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

const iconOptions = [
  { icon: "✏️", label: "أقلام" }, { icon: "📓", label: "دفاتر" }, { icon: "📐", label: "هندسية" },
  { icon: "🔢", label: "حاسبة" }, { icon: "🎒", label: "مدرسية" }, { icon: "📎", label: "مكتبية" },
  { icon: "🖨️", label: "طباعة" }, { icon: "🎨", label: "رسم" }, { icon: "📦", label: "عام" },
  { icon: "🖊️", label: "قلم" }, { icon: "📏", label: "مسطرة" }, { icon: "✂️", label: "مقص" },
  { icon: "🗂️", label: "ملفات" }, { icon: "📋", label: "لوح" }, { icon: "🖇️", label: "مشبك" },
  { icon: "🖍️", label: "قلم تلوين" }, { icon: "📌", label: "دبوس" }, { icon: "🔭", label: "علوم" },
  { icon: "📚", label: "كتب" }, { icon: "🗃️", label: "أرشيف" },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // ✅ حالة الترتيب
  const [sortOption, setSortOption] = useState<'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc'>('name-asc');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✏️');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } catch (error) { console.error('خطأ:', error); } 
    finally { setLoading(false); }
  };

  // ✅ دالة إضافة منتج (تحديثت لتدعم images array)
  const handleAddProduct = async (formData: Partial<Product>) => {
    try {
      const { name, price, originalPrice, rating, category, barcode, stock, images, hasColors, colors } = formData;
      
      if (!name || !price || !category || !barcode) {
        setModalConfig({ isOpen: true, title: 'خطأ', message: 'الاسم والسعر والفئة والباركود مطلوبة', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
        return;
      }
      
      const docRef = await addDoc(collection(db, 'products'), {
        name, 
        price: Number(price), 
        originalPrice: Number(originalPrice) || 0, 
        rating: Number(rating) || 4.5,
        category, 
        barcode, 
        stock: Number(stock) || 0, 
        images: images || [], // ✅ حفظ مصفوفة الصور
        hasColors: hasColors || false,
        colors: colors || [],
        createdAt: serverTimestamp(),
      });

      setProducts([...products, {
        id: docRef.id, 
        name: name!, 
        price: Number(price), 
        originalPrice: Number(originalPrice) || 0,
        rating: Number(rating) || 4.5, 
        category: category!, 
        barcode: barcode!, 
        stock: Number(stock) || 0, 
        images: images || [],
        hasColors: hasColors || false,
        colors: colors || [],
      }]);
      
      setShowAddForm(false);
      setModalConfig({ isOpen: true, title: 'نجاح ✓', message: 'تم إضافة المنتج بنجاح', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    } catch (error) {
      console.error(error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'حدث خطأ في إضافة المنتج', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  };

  const handleDeleteProduct = (id: string) => {
    setModalConfig({ isOpen: true, title: 'حذف المنتج', message: 'هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟', onConfirm: () => executeDeleteProduct(id) });
  };

  const executeDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter((p) => p.id !== id));
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error(error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'حدث خطأ أثناء حذف المنتج', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  };

  // ✅ دالة تعديل منتج (تحديثت لتدعم images array)
  const handleEditProduct = async (id: string, updatedData: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), updatedData);
      setProducts(products.map((p) => (p.id === id ? { ...p, ...updatedData } : p)));
      setModalConfig({ isOpen: true, title: 'نجاح ✓', message: 'تم تحديث المنتج بنجاح', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    } catch (error) {
      console.error(error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'حدث خطأ في تحديث المنتج', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'يرجى اختيار ملف صورة صالح', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
      return;
    }
    setNewCatImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewCatImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'يرجى كتابة اسم القسم!', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
      return;
    }
    try {
      let imageUrl: string | undefined = undefined;
      if (newCatImage) imageUrl = newCatImagePreview || undefined;
      await addDoc(collection(db, 'categories'), { name: newCatName.trim(), icon: imageUrl ? '' : newCatIcon, imageUrl: imageUrl || '' });
      setNewCatName(''); setNewCatIcon('✏️'); setNewCatImage(null); setNewCatImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setModalConfig({ isOpen: true, title: 'تمت الإضافة ✓', message: `تم إضافة قسم "${newCatName.trim()}" بنجاح`, onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    } catch (error) {
      console.error(error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'حدث خطأ أثناء إضافة القسم', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    setModalConfig({ isOpen: true, title: 'حذف القسم', message: `هل أنت متأكد من حذف قسم "${catName}"؟`, onConfirm: () => executeDeleteCategory(catId) });
  };

  const executeDeleteCategory = async (catId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', catId));
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('خطأ في حذف القسم:', error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'حدث خطأ أثناء حذف القسم', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  };

  // ✅ منطق الترتيب
  const sortedProducts = useMemo(() => {
    const prods = [...products];
    if (sortOption === 'name-asc') return prods.sort((a, b) => a.name.localeCompare(b.name));
    if (sortOption === 'name-desc') return prods.sort((a, b) => b.name.localeCompare(a.name));
    if (sortOption === 'stock-asc') return prods.sort((a, b) => (a.stock || 0) - (b.stock || 0)); // الأقل أولاً
    if (sortOption === 'stock-desc') return prods.sort((a, b) => (b.stock || 0) - (a.stock || 0)); // الأكثر أولاً
    return prods;
  }, [products, sortOption]);

  if (!authChecked) return null;

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      <ConfirmModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })} confirmText={modalConfig.title.includes('حذف') ? 'تأكيد الحذف' : 'موافق'} cancelText="رجوع" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/admin')} className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition font-bold text-sm mb-8"><ArrowRight size={18} /> العودة للوحة التحكم</button>

        {/* 🔴 مستطيل إدارة الأقسام */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-5"><Tags size={20} className="text-purple-400" />إدارة الأقسام</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-400 text-sm font-bold whitespace-nowrap">➕ إضافة قسم:</span>
              {!newCatImagePreview && ( <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="h-10 px-3 rounded-lg text-white text-sm outline-none" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}> {iconOptions.map((item) => ( <option key={item.icon} value={item.icon} className="bg-slate-800">{item.icon} {item.label}</option> ))} </select> )}
              <label className="flex items-center gap-2 px-3 h-10 rounded-lg cursor-pointer transition hover:bg-purple-500/20" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}> <Upload size={16} className="text-purple-400" /> <span className="text-xs text-white">رفع صورة</span> <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} /> </label>
              {newCatImagePreview && ( <div className="relative w-10 h-10 rounded-full overflow-hidden border border-purple-400 flex-shrink-0"> <img src={newCatImagePreview} alt="preview" className="w-full h-full object-cover" /> <button onClick={() => { setNewCatImage(null); setNewCatImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">×</button> </div> )}
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-1 h-10 px-3 rounded-lg text-white text-sm outline-none placeholder:text-slate-600 min-w-[180px]" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }} onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
              <button onClick={handleAddCategory} className="h-10 px-5 rounded-lg font-bold text-white text-sm transition hover:opacity-90 whitespace-nowrap" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>إضافة</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.length === 0 ? ( <span className="text-xs text-slate-600">لا توجد أقسام بعد...</span> ) : ( categories.map((cat) => ( <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full group transition" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)" }}> {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" /> : <span className="text-sm">{cat.icon}</span>} <span className="text-xs font-bold text-purple-300">{cat.name}</span> <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100" title="حذف القسم"><X size={14} /></button> </div> )) )}
            </div>
          </div>
        </div>

        {/* 🔵 مستطيل إدارة المنتجات */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-purple-400" />إدارة المنتجات</h2>
              {/* ✅ عداد المنتجات */}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {products.length} منتج
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* ✅ أداة الترتيب */}
              <div className="relative group">
                 <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 bg-slate-800/50 border border-slate-700 hover:border-purple-500 transition">
                   <Filter size={14} />
                   <span>ترتيب حسب</span>
                 </button>
                 {/* قائمة الترتيب */}
                 <div className="absolute top-full left-0 mt-2 w-40 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20" style={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)" }}>
                    <button onClick={() => setSortOption('name-asc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-500/20 transition ${sortOption === 'name-asc' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>الاسم (أ-ي)</button>
                    <button onClick={() => setSortOption('name-desc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-500/20 transition ${sortOption === 'name-desc' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>الاسم (ي-أ)</button>
                    <button onClick={() => setSortOption('stock-desc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-500/20 transition ${sortOption === 'stock-desc' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>الأكثر مخزوناً</button>
                    <button onClick={() => setSortOption('stock-asc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-500/20 transition ${sortOption === 'stock-asc' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>الأقل مخزوناً</button>
                 </div>
              </div>

              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition" style={{ background: showAddForm ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, #7c3aed, #ec4899)", border: showAddForm ? "1px solid rgba(239,68,68,0.4)" : "none", color: showAddForm ? "#f87171" : "white" }}> 
                {showAddForm ? <X size={16} /> : <Plus size={16} />} {showAddForm ? 'إلغاء الإضافة' : 'إضافة منتج جديد'} 
              </button>
            </div>
          </div>

          {showAddForm && ( <div className="mb-8 p-6 rounded-xl" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}> <h3 className="text-lg font-black text-white mb-5">إضافة منتج جديد</h3> <AdminProductForm onSubmit={handleAddProduct} /> </div> )}
          
          {/* ✅ تمرير المنتجات المرتبة للجدول */}
          <AdminProductTable products={sortedProducts} onDelete={handleDeleteProduct} onEditPrice={(product) => setEditingPrice(product)} loading={loading} />
        </div>
      </div>

      {editingPrice && <AdminPriceEditor product={editingPrice} onClose={() => setEditingPrice(null)} onSubmit={handleEditProduct} />}
    </div>
  );
}