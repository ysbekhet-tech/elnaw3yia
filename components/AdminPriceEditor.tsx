'use client';

import { Product, ProductColor } from '@/types';
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { X, Save, ChevronDown, Check, Upload, Palette, Plus, ImagePlus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AdminPriceEditorProps {
  product: Product | null;
  onClose: () => void;
  onSubmit: (productId: string, updatedData: Partial<Product>) => Promise<void>;
  loading?: boolean;
}

const inputClass = "w-full px-4 py-3 rounded-xl outline-none text-sm text-white placeholder-slate-600 transition";
const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" };

export default function AdminPriceEditor({ product, onClose, onSubmit, loading = false }: AdminPriceEditorProps) {
  const [formData, setFormData] = useState({
    name: '', price: 0, originalPrice: 0, stock: 0, category: '', barcode: '', description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newColorImage, setNewColorImage] = useState<string | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '', price: product.price || 0, originalPrice: product.originalPrice || 0,
        stock: product.stock || 0, category: product.category || '', barcode: product.barcode || '', description: product.description || ''
      });

      if (Array.isArray(product.images) && product.images.length > 0) {
        setImagePreviews(product.images);
      } else if ((product as any).image) {
        setImagePreviews([(product as any).image]);
      } else {
        setImagePreviews([]);
      }

      setHasColors(product.hasColors || false);
      setColors(product.colors || []);
    }
  }, [product]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => setCategories(snapshot.docs.map(doc => doc.data().name as string)));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setCategoryOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!product) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = [...imagePreviews];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          setImagePreviews([...newImages]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleColorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setNewColorImage(reader.result as string); reader.readAsDataURL(file); }
  };

  const handleAddColor = () => {
    if (!newColorName || !newColorImage) { alert("يجب إدخال اسم اللون وصورته!"); return; }
    setColors([...colors, { name: newColorName, hex: newColorHex, image: newColorImage }]);
    setNewColorName(""); setNewColorHex("#000000"); setNewColorImage(null);
    if (colorFileInputRef.current) colorFileInputRef.current.value = "";
  };

  const handleRemoveColor = (index: number) => setColors(colors.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!formData.name || formData.price <= 0 || !formData.category || !formData.barcode) { alert('يرجى ملء جميع الحقول المطلوبة'); return; }
    if (!product.id) { alert('المنتج لا يحتوي على معرف صالح'); return; }
    setIsSubmitting(true);
    try {
      await onSubmit(product.id, {
        ...formData, 
        images: imagePreviews,
        originalPrice: Number(formData.originalPrice) || 0,
        hasColors: hasColors, colors: hasColors ? colors : []
      });
      onClose();
    } catch (error) { console.error('خطأ في التحديث:', error); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6" style={{ background: "rgba(8,8,20,0.98)", border: "1px solid rgba(124,58,237,0.35)", boxShadow: "0 0 60px rgba(124,58,237,0.2), 0 25px 60px rgba(0,0,0,0.6)" }}>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white">تعديل بيانات المنتج</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition" style={{ border: "1px solid rgba(255,255,255,0.1)" }}><X size={18} className="text-slate-400" /></button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">صور المنتج</label>
            <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition hover:bg-purple-500/20 text-white text-sm w-fit" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    <ImagePlus size={16} className="text-purple-400" /> إضافة / تغيير الصور
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} ref={fileInputRef} />
                </label>
                {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {imagePreviews.map((img, idx) => (
                            <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-purple-500/30">
                                <img src={img} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">اسم المنتج *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} style={inputStyle} disabled={isSubmitting} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">وصف المنتج</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} style={inputStyle} rows={3} disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">السعر (جنيه) *</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className={inputClass} style={inputStyle} disabled={isSubmitting} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">السعر قبل الخصم</label>
              <input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })} className={inputClass} style={inputStyle} disabled={isSubmitting} />
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Palette size={14} className="text-purple-400" />
                هل المنتج متعدد الألوان؟
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setHasColors(false); setColors([]); }} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasColors ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>لا</button>
                <button type="button" onClick={() => setHasColors(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasColors ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>نعم</button>
              </div>
            </div>

            {hasColors && (
              <div className="mt-4 border-t border-slate-700 pt-4">
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {colors.map((color, index) => (
                      <div key={index} className="relative group flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full border-2 border-slate-600 overflow-hidden">
                          <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] text-slate-400">{color.name}</span>
                        <button type="button" onClick={() => handleRemoveColor(index)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">اسم اللون</label>
                    <input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="مثال: أحمر" className="w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border border-slate-700 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">كود اللون</label>
                    <div className="flex items-center gap-2 h-10 px-2 rounded-lg bg-slate-800 border border-slate-700">
                      <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-6 h-6 bg-transparent cursor-pointer" />
                      <span className="text-slate-400 text-xs">{newColorHex}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">صورة اللون</label>
                    <label className="flex items-center gap-1 h-10 px-2 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
                      <Upload size={14} className="text-purple-400" />
                      <span className="text-xs text-slate-400">{newColorImage ? "تم الاختيار" : "اختر صورة"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleColorImageChange} ref={colorFileInputRef} />
                    </label>
                  </div>
                  <button type="button" onClick={handleAddColor} className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1">
                    <Plus size={14} /> إضافة لون
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">الكمية المتاحة</label>
            <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className={inputClass} style={inputStyle} disabled={isSubmitting} />
          </div>

          <div ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">الفئة *</label>
            <div className="relative">
              <button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className="w-full px-4 py-3 rounded-xl text-sm text-right flex items-center justify-between transition" style={{ background: "rgba(255,255,255,0.06)", border: categoryOpen ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(124,58,237,0.3)", color: formData.category ? "#e2e8f0" : "#4b5563" }} disabled={isSubmitting}>
                <span>{formData.category || "اختر الفئة"}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {categoryOpen && (
                <div className="absolute top-full right-0 left-0 mt-1 rounded-2xl overflow-auto z-50" style={{ background: "rgba(10,10,25,0.99)", border: "1px solid rgba(124,58,237,0.4)", maxHeight: "200px" }}>
                  {categories.map((cat) => (
                    <button key={cat} type="button" onClick={() => { setFormData({ ...formData, category: cat }); setCategoryOpen(false); }} className="w-full px-4 py-2.5 text-right text-sm" style={{ color: formData.category === cat ? "#a78bfa" : "#cbd5e1" }}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">الباركود *</label>
            <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className={inputClass} style={inputStyle} disabled={isSubmitting} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition text-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>إلغاء</button>
          <button onClick={handleSubmit} disabled={isSubmitting || loading} className="flex-1 py-3 rounded-xl font-bold text-white transition text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <Save size={16} /> {isSubmitting || loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  );
}