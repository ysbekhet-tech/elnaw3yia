"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Upload, ChevronDown, Check, X, Save, Palette, Trash2, Plus, ImagePlus } from "lucide-react";
import { Product, ProductColor } from "@/types";

interface AdminProductFormProps {
  onSubmit: (formData: Partial<Product>) => void;
}

export default function AdminProductForm({ onSubmit }: AdminProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    barcode: "",
    stock: "",
    description: "",
  });

  // ✅ تغيير من صورة واحدة لمصفوفة صور
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // بيانات الألوان
  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newColorImage, setNewColorImage] = useState<string | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const catsList = snapshot.docs.map((doc) => doc.data().name as string);
      setCategories(catsList);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ دالة رفع صور متعددة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [...imagePreviews];
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
    const newImages = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newImages);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleColorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewColorImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = () => {
    if (!newColorName || !newColorImage) {
      alert("يجب إدخال اسم اللون وصورته!");
      return;
    }
    setColors([...colors, { name: newColorName, hex: newColorHex, image: newColorImage }]);
    setNewColorName("");
    setNewColorHex("#000000");
    setNewColorImage(null);
    if (colorFileInputRef.current) colorFileInputRef.current.value = "";
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Number(formData.price),
      originalPrice: Number(formData.originalPrice),
      stock: Number(formData.stock),
      images: imagePreviews, // ✅ إرسال مصفوفة الصور
      hasColors: hasColors,
      colors: hasColors ? colors : [], 
    });

    // تنظيف الفورم
    setFormData({ name: "", price: "", originalPrice: "", category: "", barcode: "", stock: "", description: "" });
    setImagePreviews([]);
    setHasColors(false);
    setColors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inputStyle = "w-full h-12 px-4 rounded-xl bg-transparent text-white border focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600";
  const borderConfig = { borderColor: "rgba(124,58,237,0.3)" };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ✅ قسم الصور المتعددة */}
      <div className="md:col-span-2">
        <label className="block text-sm font-bold text-slate-400 mb-2">صور المنتج (متعدد)</label>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 h-12 rounded-xl cursor-pointer transition hover:bg-purple-500/20" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <ImagePlus size={16} className="text-purple-400" />
              <span className="text-xs text-white">اختر صور</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} ref={fileInputRef} />
            </label>
            <span className="text-xs text-slate-500">{imagePreviews.length} صور مختارة</span>
          </div>
          
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-purple-500/30">
                  <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="اسم المنتج *" required className={inputStyle} style={borderConfig} />
      <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="السعر *" required className={inputStyle} style={borderConfig} />
      <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="السعر قبل الخصم" className={inputStyle} style={borderConfig} />
      
      <div className="md:col-span-2">
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="اكتب وصف المنتج..." rows={3} className="w-full px-4 py-3 rounded-xl bg-transparent text-white border focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600 resize-none" style={borderConfig} />
      </div>

      {/* قسم الألوان (كما هو) */}
      <div className="md:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <Palette size={16} className="text-purple-400" />
            هل المنتج متعدد الألوان؟
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setHasColors(false)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasColors ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>لا</button>
            <button type="button" onClick={() => setHasColors(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasColors ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>نعم</button>
          </div>
        </div>
        {hasColors && (
          <div className="mt-4 border-t border-slate-700 pt-4">
             {/* كود إضافة الألوان كما هو في كودك الأصلي */}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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

      <div ref={dropdownRef} className="relative">
        <button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className="w-full h-12 px-4 rounded-xl text-sm text-right flex items-center justify-between transition bg-transparent" style={{ border: categoryOpen ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(124,58,237,0.3)", color: formData.category ? "#e2e8f0" : "#4b5563" }}>
          <span>{formData.category || "اختر الفئة *"}</span>
          <ChevronDown size={16} className="text-slate-400" style={{ transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>
        {categoryOpen && (
          <div className="absolute top-full right-0 left-0 mt-1 rounded-2xl overflow-auto z-50" style={{ background: "rgba(10,10,25,0.99)", border: "1px solid rgba(124,58,237,0.4)", maxHeight: "200px" }}>
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => { setFormData({ ...formData, category: cat }); setCategoryOpen(false); }} className="w-full px-4 py-2.5 text-right text-sm flex items-center justify-between transition" style={{ color: formData.category === cat ? "#a78bfa" : "#cbd5e1", background: formData.category === cat ? "rgba(124,58,237,0.15)" : "transparent" }}>
                <span>{cat}</span>
                {formData.category === cat && <Check size={14} className="text-purple-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="الباركود *" required className={inputStyle} style={borderConfig} />
      <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="الكمية بالمخزن" className={inputStyle} style={borderConfig} />

      <div className="md:col-span-2 mt-2">
        <button type="submit" className="w-full h-14 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          <Save size={18} />
          حفظ المنتج في الداتابيز
        </button>
      </div>
    </form>
  );
}