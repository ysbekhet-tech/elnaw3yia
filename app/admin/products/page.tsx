'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { Package, Plus, X, Tags, ArrowRight, Filter, ImagePlus } from 'lucide-react';
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
  
  const [sortOption, setSortOption] = useState<'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc'>('name-asc');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✏️');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState<string | null>(null);
  const [isCatImageDragging, setIsCatImageDragging] = useState(false);
  const catDropZoneRef = useRef<HTMLDivElement>(null);
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

  const handleCatImageFromUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        setModalConfig({ isOpen: true, title: 'خطأ', message: 'الرابط ده مش صورة!', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCatImagePreview(reader.result as string);
        setNewCatImage(new File([blob], `category_${Date.now()}.jpg`, { type: blob.type }));
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading image from URL:", error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'مقدرش أحمل الصورة من الرابط ده.', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  }, []);

  const handleCatDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsCatImageDragging(true); }, []);
  const handleCatDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsCatImageDragging(false); }, []);

  const handleCatDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsCatImageDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setNewCatImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setNewCatImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
      return;
    }
    const items = e.dataTransfer.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'string') {
          item.getAsString(async (url) => {
            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || url.startsWith('http')) await handleCatImageFromUrl(url);
          });
        }
      }
    }
    const textData = e.dataTransfer.getData('text/plain');
    if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) await handleCatImageFromUrl(textData);
    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList) {
      const urls = uriList.split('\n').filter(url => url.trim() && !url.startsWith('#'));
      for (const url of urls) { if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) await handleCatImageFromUrl(url); }
    }
  }, [handleCatImageFromUrl]);

  // ✅ دالة إخفاء وإظهار المنتج
  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { isActive: !currentVisibility });
      setProducts(products.map(p => p.id === id ? { ...p, isActive: !currentVisibility } : p));
    } catch (error) {
      console.error(error);
      setModalConfig({ isOpen: true, title: 'خطأ', message: 'حدث خطأ في تحديث حالة المنتج', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
    }
  };

  const handleAddProduct = async (formData: Partial<Product>) => {
    try {
      const { name, price, originalPrice, rating, category, barcode, stock, images, hasColors, colors, hasSizes, sizes } = formData;
      const minStock = Number((formData as any).minStock) || 5;
      
      if (!name || !price || !category || !barcode) {
        setModalConfig({ isOpen: true, title: 'خطأ', message: 'الاسم والسعر والفئة والباركود مطلوبة', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
        return;
      }
      
      const docRef = await addDoc(collection(db, 'products'), {
        name, price: Number(price), originalPrice: Number(originalPrice) || 0, rating: Number(rating) || 4.5,
        category, barcode, stock: Number(stock) || 0, minStock: Number(minStock) || 5,
        images: images || [], hasColors: hasColors || false, colors: colors || [],
        hasSizes: hasSizes || false, sizes: sizes || [], createdAt: serverTimestamp(), isActive: true // المنتج يكون ظاهر افتراضياً
      });

      setProducts([...products, {
        id: docRef.id, name: name!, price: Number(price), originalPrice: Number(originalPrice) || 0,
        rating: Number(rating) || 4.5, category: category!, barcode: barcode!, stock: Number(stock) || 0, 
        minStock: Number(minStock) || 5, images: images || [], hasColors: hasColors || false, colors: colors || [],
        hasSizes: hasSizes || false, sizes: sizes || [], isActive: true
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

  const sortedProducts = useMemo(() => {
    const prods = [...products];
    if (sortOption === 'name-asc') return prods.sort((a, b) => a.name.localeCompare(b.name));
    if (sortOption === 'name-desc') return prods.sort((a, b) => b.name.localeCompare(a.name));
    if (sortOption === 'stock-asc') return prods.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    if (sortOption === 'stock-desc') return prods.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    return prods;
  }, [products, sortOption]);

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <ConfirmModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })} confirmText={modalConfig.title.includes('حذف') ? 'تأكيد الحذف' : 'موافق'} cancelText="رجوع" />

      <div className="max-w-7xl mx-auto px-4 py-8">
      

        {/* قسم إدارة الأقسام */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-5"><Tags size={20} className="text-purple-600" />إدارة الأقسام</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-600 text-sm font-bold whitespace-nowrap">➕ إضافة قسم:</span>
              {!newCatImagePreview && ( 
                <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="h-10 px-3 rounded-lg text-slate-900 text-sm outline-none bg-slate-50 border border-slate-300 focus:border-purple-400"> 
                  {iconOptions.map((item) => ( <option key={item.icon} value={item.icon}>{item.icon} {item.label}</option> ))} 
                </select> 
              )}
              
              <div
                ref={catDropZoneRef}
                onDragOver={handleCatDragOver}
                onDragLeave={handleCatDragLeave}
                onDrop={handleCatDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-3 h-10 rounded-lg cursor-pointer transition border ${
                  isCatImageDragging ? 'bg-purple-50 border-purple-400' : 'bg-slate-50 border-slate-300 hover:border-purple-400'
                }`}
              >
                <ImagePlus size={16} className="text-purple-600" />
                <span className="text-xs text-slate-700">
                  {isCatImageDragging ? "أفلت الصورة هنا..." : "رفع صورة"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} />
              </div>

              {newCatImagePreview && ( <div className="relative w-10 h-10 rounded-full overflow-hidden border border-purple-400 flex-shrink-0"> <img src={newCatImagePreview} alt="preview" className="w-full h-full object-cover" /> <button onClick={() => { setNewCatImage(null); setNewCatImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">×</button> </div> )}
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-1 h-10 px-3 rounded-lg text-slate-900 text-sm outline-none placeholder:text-slate-400 min-w-[180px] bg-slate-50 border border-slate-300 focus:border-purple-400" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
              <button onClick={handleAddCategory} className="h-10 px-5 rounded-lg font-bold text-white text-sm transition hover:opacity-90 whitespace-nowrap" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>إضافة</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.length === 0 ? ( <span className="text-xs text-slate-400">لا توجد أقسام بعد...</span> ) : ( categories.map((cat) => ( 
                <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full group transition bg-purple-50 border border-purple-200"> 
                  {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" /> : <span className="text-sm">{cat.icon}</span>} 
                  <span className="text-xs font-bold text-purple-700">{cat.name}</span> 
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100" title="حذف القسم"><X size={14} /></button> 
                </div> 
              )) )}
            </div>
          </div>
        </div>

        {/* قسم إدارة المنتجات */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Package size={20} className="text-purple-600" />إدارة المنتجات</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {products.length} منتج
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                 <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-purple-400 transition">
                   <Filter size={14} />
                   <span>ترتيب حسب</span>
                 </button>
                 <div className="absolute top-full left-0 mt-2 w-40 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 bg-white border border-slate-200">
                    <button onClick={() => setSortOption('name-asc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'name-asc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الاسم (أ-ي)</button>
                    <button onClick={() => setSortOption('name-desc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'name-desc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الاسم (ي-أ)</button>
                    <button onClick={() => setSortOption('stock-desc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'stock-desc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الأكثر مخزوناً</button>
                    <button onClick={() => setSortOption('stock-asc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'stock-asc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الأقل مخزوناً</button>
                 </div>
              </div>

              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition" style={{ background: showAddForm ? "white" : "linear-gradient(135deg, #7c3aed, #ec4899)", border: showAddForm ? "1px solid #fecaca" : "none", color: showAddForm ? "#ef4444" : "white" }}> 
                {showAddForm ? <X size={16} /> : <Plus size={16} />} {showAddForm ? 'إلغاء الإضافة' : 'إضافة منتج جديد'} 
              </button>
            </div>
          </div>

          {showAddForm && ( <div className="mb-8 p-6 rounded-xl bg-slate-50 border border-slate-200"> <h3 className="text-lg font-black text-slate-900 mb-5">إضافة منتج جديد</h3> <AdminProductForm onSubmit={handleAddProduct} /> </div> )}
          
          {/* ✅ ضفت onToggleVisibility كـ Prop للجدول */}
          <AdminProductTable 
            products={sortedProducts} 
            onDelete={handleDeleteProduct} 
            onEditPrice={(product) => setEditingPrice(product)} 
            onToggleVisibility={handleToggleVisibility}
            loading={loading} 
          />
        </div>
      </div>

      {editingPrice && <AdminPriceEditor product={editingPrice} onClose={() => setEditingPrice(null)} onSubmit={handleEditProduct} />}
    </div>
  );
}