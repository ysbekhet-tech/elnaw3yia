'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Package, Plus, X, Tags, Filter, ImagePlus, Edit2, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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

const PRODUCTS_PER_PAGE = 30;

export default function ProductsPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc' | 'newest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✏️');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState<string | null>(null);
  const [isCatImageDragging, setIsCatImageDragging] = useState(false);
  const catDropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editCatFileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editCatImagePreview, setEditCatImagePreview] = useState<string | null>(null);

  const [catCropModalOpen, setCatCropModalOpen] = useState(false);
  const [catImageToCrop, setCatImageToCrop] = useState<string | null>(null);
  const [catCropTarget, setCatCropTarget] = useState<'add' | 'edit'>('add');
  const [catCrop, setCatCrop] = useState<Crop>();
  const [catCompletedCrop, setCatCompletedCrop] = useState<PixelCrop>();
  const catImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return () => unsubscribe();
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      setAllProducts(prods);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchAllProducts();
    }
  }, [authChecked, fetchAllProducts]);

  // فلترة وترتيب المنتجات
  const filtered = useMemo(() => {
    let result = [...allProducts];

    // البحث
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.barcode === searchTerm
      );
    }

    // الترتيب
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      }
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'ar');
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name, 'ar');
      if (sortOption === 'stock-asc') return a.stock - b.stock;
      if (sortOption === 'stock-desc') return b.stock - a.stock;
      return 0;
    });

    return result;
  }, [allProducts, searchTerm, sortOption]);

  // إعدادات الباجينيشن (الترقيم)
  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const currentProducts = filtered.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  // إرجاع للصفحة الأولى عند البحث أو تغيير الترتيب
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOption]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const openCatCropModal = (imageUrl: string, target: 'add' | 'edit') => { setCatImageToCrop(imageUrl); setCatCropTarget(target); setCatCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 }); setCatCompletedCrop(undefined); setCatCropModalOpen(true); };
  const onCatImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => { catImgRef.current = e.currentTarget; };
  async function getCatCroppedImg() { const image = catImgRef.current; if (!image || !catCompletedCrop) return null; const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null; if (!ctx) return null; const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height; canvas.width = catCompletedCrop.width * scaleX; canvas.height = catCompletedCrop.height * scaleY; ctx.drawImage(image, catCompletedCrop.x * scaleX, catCompletedCrop.y * scaleY, catCompletedCrop.width * scaleX, catCompletedCrop.height * scaleY, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg"); }
  const handleSaveCatCrop = async () => { try { const croppedImage = await getCatCroppedImg(); if (croppedImage) { if (catCropTarget === 'add') { setNewCatImagePreview(croppedImage); setNewCatImage(new File([croppedImage], `category_${Date.now()}.jpg`, { type: 'image/jpeg' })); } else { setEditCatImagePreview(croppedImage); } } } catch (e) { console.error(e); } setCatCropModalOpen(false); setCatImageToCrop(null); };
  const handleCatImageFromUrl = useCallback(async (url: string) => { try { const response = await fetch(url); const blob = await response.blob(); if (!blob.type.startsWith('image/')) { setModalConfig({ isOpen: true, title: 'خطأ', message: 'الرابط ده مش صورة!', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) }); return; } const reader = new FileReader(); reader.onloadend = () => openCatCropModal(reader.result as string, 'add'); reader.readAsDataURL(blob); } catch (error) { console.error("Error loading image from URL:", error); } }, []);
  const handleCatDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsCatImageDragging(true); }, []);
  const handleCatDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsCatImageDragging(false); }, []);
  const handleCatDrop = useCallback(async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsCatImageDragging(false); const files = e.dataTransfer.files; if (files.length > 0) { const file = files[0]; if (file.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => openCatCropModal(reader.result as string, 'add'); reader.readAsDataURL(file); } return; } const items = e.dataTransfer.items; if (items) { for (let i = 0; i < items.length; i++) { const item = items[i]; if (item.kind === 'string') { item.getAsString(async (url) => { if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || url.startsWith('http')) await handleCatImageFromUrl(url); }); } } } const textData = e.dataTransfer.getData('text/plain'); if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) await handleCatImageFromUrl(textData); const uriList = e.dataTransfer.getData('text/uri-list'); if (uriList) { const urls = uriList.split('\n').filter(url => url.trim() && !url.startsWith('#')); for (const url of urls) { if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) await handleCatImageFromUrl(url); } } }, [handleCatImageFromUrl]);

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => { try { await updateDoc(doc(db, 'products', id), { isActive: !currentVisibility }); setAllProducts(allProducts.map(p => p.id === id ? { ...p, isActive: !currentVisibility } : p)); } catch (error) { console.error(error); } };

  const handleAddProduct = async (formData: Partial<Product>) => { 
    try { 
      const { name, price, originalPrice, rating, category, barcode, stock, images, hasColors, colors, hasSizes, sizes, description } = formData; 
      const minStock = Number((formData as any).minStock) || 5; 
      const countryOfOrigin = (formData as any).countryOfOrigin || ''; 
      if (!name || !price || !category || !barcode) { 
        setModalConfig({ isOpen: true, title: 'خطأ', message: 'الاسم والسعر والفئة والباركود مطلوبة', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) }); 
        return; 
      } 
      const docRef = await addDoc(collection(db, 'products'), { 
        name, 
        description: description || '',
        price: Number(price), 
        originalPrice: Number(originalPrice) || 0, 
        rating: Number(rating) || 4.5, 
        category, 
        barcode, 
        stock: Number(stock) || 0, 
        minStock: Number(minStock) || 5, 
        countryOfOrigin, 
        images: images || [], 
        hasColors: hasColors || false, 
        colors: colors || [], 
        hasSizes: hasSizes || false, 
        sizes: sizes || [], 
        createdAt: serverTimestamp(), 
        isActive: true 
      }); 
      
      const newProduct: Product = { 
        id: docRef.id, 
        name: name!, 
        description: description || '',
        price: Number(price), 
        originalPrice: Number(originalPrice) || 0, 
        rating: Number(rating) || 4.5, 
        category: category!, 
        barcode: barcode!, 
        stock: Number(stock) || 0, 
        minStock: Number(minStock) || 5, 
        countryOfOrigin, 
        images: images || [], 
        hasColors: hasColors || false, 
        colors: colors || [], 
        hasSizes: hasSizes || false, 
        sizes: sizes || [], 
        isActive: true,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any 
      };

      setAllProducts([newProduct, ...allProducts]); 
      setShowAddForm(false); 
      setModalConfig({ isOpen: true, title: 'نجاح ✓', message: 'تم إضافة المنتج بنجاح', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) }); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  const handleDeleteProduct = (id: string) => { setModalConfig({ isOpen: true, title: 'حذف المنتج', message: 'هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟', onConfirm: () => executeDeleteProduct(id) }); };
  const executeDeleteProduct = async (id: string) => { try { await deleteDoc(doc(db, 'products', id)); setAllProducts(allProducts.filter((p) => p.id !== id)); setModalConfig(prev => ({ ...prev, isOpen: false })); } catch (error) { console.error(error); } };

  const handleEditProduct = async (id: string, updatedData: Partial<Product>) => { 
    try { 
      await updateDoc(doc(db, 'products', id), updatedData); 
      setAllProducts(allProducts.map((p) => (p.id === id ? { ...p, ...updatedData } : p))); 
      setModalConfig({ isOpen: true, title: 'نجاح ✓', message: 'تم تحديث المنتج بنجاح', onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) }); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) return; const reader = new FileReader(); reader.onloadend = () => openCatCropModal(reader.result as string, 'add'); reader.readAsDataURL(file); };
  const handleEditCatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !file.type.startsWith('image/')) return; const reader = new FileReader(); reader.onloadend = () => openCatCropModal(reader.result as string, 'edit'); reader.readAsDataURL(file); };

  const handleAddCategory = async () => { if (!newCatName.trim()) return; try { let imageUrl: string | undefined = undefined; if (newCatImage) imageUrl = newCatImagePreview || undefined; await addDoc(collection(db, 'categories'), { name: newCatName.trim(), icon: imageUrl ? '' : newCatIcon, imageUrl: imageUrl || '' }); setNewCatName(''); setNewCatIcon('✏️'); setNewCatImage(null); setNewCatImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; setModalConfig({ isOpen: true, title: 'تمت الإضافة ✓', message: `تم إضافة قسم "${newCatName.trim()}" بنجاح`, onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) }); } catch (error) { console.error(error); } };
  const handleStartEditCategory = (cat: Category) => { setEditingCatId(cat.id); setEditingCatName(cat.name); setEditCatImagePreview(cat.imageUrl || null); };
  const handleCancelEditCategory = () => { setEditingCatId(null); setEditingCatName(''); setEditCatImagePreview(null); };
  const handleUpdateCategory = async (catId: string) => { if (!editingCatName.trim()) return; try { const catRef = doc(db, 'categories', catId); await updateDoc(catRef, { name: editingCatName.trim(), imageUrl: editCatImagePreview || '', icon: editCatImagePreview ? '' : (categories.find(c => c.id === catId)?.icon || '📦') }); handleCancelEditCategory(); } catch (error) { console.error(error); } };
  const handleDeleteCategory = (catId: string, catName: string) => { setModalConfig({ isOpen: true, title: 'حذف القسم', message: `هل أنت متأكد من حذف قسم "${catName}"؟`, onConfirm: () => executeDeleteCategory(catId) }); };
  const executeDeleteCategory = async (catId: string) => { try { await deleteDoc(doc(db, 'categories', catId)); setModalConfig(prev => ({ ...prev, isOpen: false })); } catch (error) { console.error('خطأ في حذف القسم:', error); } };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {catCropModalOpen && catImageToCrop && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl max-w-3xl max-h-[80vh] overflow-auto">
            <ReactCrop crop={catCrop} onChange={(c) => setCatCrop(c)} onComplete={(c) => setCatCompletedCrop(c)}>
              <img ref={catImgRef} src={catImageToCrop} alt="Crop" onLoad={onCatImageLoad} style={{ maxWidth: "100%", maxHeight: "60vh" }} />
            </ReactCrop>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={handleSaveCatCrop} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2"><Check size={16} /> حفظ القص</button>
            <button onClick={() => { setCatCropModalOpen(false); setCatImageToCrop(null); }} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2"><X size={16} /> إلغاء</button>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })} confirmText={modalConfig.title.includes('حذف') ? 'تأكيد الحذف' : 'موافق'} cancelText="رجوع" />

      <div className="max-w-7xl mx-auto px-4 py-8">
      
        {/* قسم إدارة الأقسام */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-5"><Tags size={20} className="text-purple-600" />إدارة الأقسام</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-600 text-sm font-bold whitespace-nowrap">➕ إضافة قسم:</span>
              {!newCatImagePreview && ( <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="h-10 px-3 rounded-lg text-slate-900 text-sm outline-none bg-slate-50 border border-slate-300 focus:border-purple-400"> {iconOptions.map((item) => ( <option key={item.icon} value={item.icon}>{item.icon} {item.label}</option> ))} </select> )}
              <div ref={catDropZoneRef} onDragOver={handleCatDragOver} onDragLeave={handleCatDragLeave} onDrop={handleCatDrop} onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 px-3 h-10 rounded-lg cursor-pointer transition border ${isCatImageDragging ? 'bg-purple-50 border-purple-400' : 'bg-slate-50 border-slate-300 hover:border-purple-400'}`}>
                <ImagePlus size={16} className="text-purple-600" /><span className="text-xs text-slate-700">{isCatImageDragging ? "أفلت الصورة هنا..." : "رفع صورة"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} />
              </div>
              {newCatImagePreview && ( <div className="relative w-10 h-10 rounded-full overflow-hidden border border-purple-400 flex-shrink-0"> <img src={newCatImagePreview} alt="preview" className="w-full h-full object-cover" /> <button onClick={() => { setNewCatImage(null); setNewCatImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">×</button> </div> )}
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-1 h-10 px-3 rounded-lg text-slate-900 text-sm outline-none placeholder:text-slate-400 min-w-[180px] bg-slate-50 border border-slate-300 focus:border-purple-400" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
              <button onClick={handleAddCategory} className="h-10 px-5 rounded-lg font-bold text-white text-sm transition hover:opacity-90 whitespace-nowrap" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>إضافة</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.length === 0 ? ( <span className="text-xs text-slate-400">لا توجد أقسام بعد...</span> ) : ( categories.map((cat) => ( <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full group transition bg-purple-50 border border-purple-200"> {editingCatId === cat.id ? ( <> <div className="relative w-6 h-6 rounded-full overflow-hidden border border-purple-300 cursor-pointer flex-shrink-0 flex items-center justify-center bg-white" onClick={() => editCatFileInputRef.current?.click()}> {(editCatImagePreview || cat.imageUrl) ? <img src={editCatImagePreview || cat.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px]">{cat.icon}</span>} <input type="file" accept="image/*" className="hidden" onChange={handleEditCatImageUpload} ref={editCatFileInputRef} /> </div> <input type="text" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} className="w-24 px-2 py-0.5 text-xs border rounded outline-none focus:border-purple-400 !text-black bg-white" /> <button onClick={() => handleUpdateCategory(cat.id)} className="text-green-600 hover:text-green-800"><Check size={14}/></button> <button onClick={() => handleCancelEditCategory()} className="text-red-500 hover:text-red-700"><X size={14}/></button> </> ) : ( <> {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" /> : <span className="text-sm">{cat.icon}</span>} <span className="text-xs font-bold text-purple-700">{cat.name}</span> <button onClick={() => handleStartEditCategory(cat)} className="text-slate-400 hover:text-blue-500 transition opacity-0 group-hover:opacity-100" title="تعديل القسم"><Edit2 size={14} /></button> <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100" title="حذف القسم"><X size={14} /></button> </> )} </div> )) )}
            </div>
          </div>
        </div>

        {/* قسم إدارة المنتجات */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 whitespace-nowrap">
                <Package size={20} className="text-purple-600" />
                إدارة المنتجات
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                {allProducts.length} منتج
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث بالاسم أو الباركود" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 h-10 pr-9 pl-3 rounded-lg text-sm outline-none bg-slate-50 border border-slate-200 focus:border-purple-400 text-black"
                />
              </div>

              <div className="relative group">
                 <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-purple-400 transition whitespace-nowrap shrink-0">
                   <Filter size={14} /> ترتيب
                 </button>
                 <div className="absolute top-full left-0 mt-2 w-40 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 bg-white border border-slate-200">
                    <button onClick={() => setSortOption('newest')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'newest' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>المضاف حديثاً</button>
                    <button onClick={() => setSortOption('name-asc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'name-asc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الاسم (أ-ي)</button>
                    <button onClick={() => setSortOption('name-desc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'name-desc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الاسم (ي-أ)</button>
                    <button onClick={() => setSortOption('stock-desc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'stock-desc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الأكثر مخزوناً</button>
                    <button onClick={() => setSortOption('stock-asc')} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === 'stock-asc' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}>الأقل مخزوناً</button>
                 </div>
              </div>

              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap shrink-0" style={{ background: showAddForm ? "white" : "linear-gradient(135deg, #7c3aed, #ec4899)", border: showAddForm ? "1px solid #fecaca" : "none", color: showAddForm ? "#ef4444" : "white" }}> 
                {showAddForm ? <X size={16} /> : <Plus size={16} />} {showAddForm ? 'إلغاء' : 'إضافة'} 
              </button>
            </div>
          </div>

          {showAddForm && ( <div className="mb-8 p-6 rounded-xl bg-slate-50 border border-slate-200"> <h3 className="text-lg font-black text-slate-900 mb-5">إضافة منتج جديد</h3> <AdminProductForm onSubmit={handleAddProduct} /> </div> )}
          
          <AdminProductTable 
            products={currentProducts} // تمرير منتجات الصفحة الحالية فقط 
            onDelete={handleDeleteProduct} 
            onEditPrice={(product) => setEditingPrice(product)} 
            onToggleVisibility={handleToggleVisibility}
            loading={loading} 
          />

          {/* ✅ أزرار الباجينيشن (الترقيم) المطابقة لطلبك تماماً */}
          {!loading && totalPages > 1 && (
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
        </div>
      </div>

      {editingPrice && <AdminPriceEditor product={editingPrice} onClose={() => setEditingPrice(null)} onSubmit={handleEditProduct} />}
    </div>
  );
}