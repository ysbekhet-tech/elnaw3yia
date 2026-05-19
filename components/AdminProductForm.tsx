"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Upload, ChevronDown, Check, X, Save, Palette, Trash2, Plus, ImagePlus, Ruler, AlertTriangle } from "lucide-react";
import { Product, ProductColor, ProductSize } from "@/types";

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
    minStock: "5", // ✅ الحد الأدنى الافتراضي للتنبيه
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newColorImage, setNewColorImage] = useState<string | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [newLength, setNewLength] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newSizePrice, setNewSizePrice] = useState("");

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

  const handleImageFromUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        alert("الرابط ده مش صورة!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading image from URL:", error);
      alert("مقدرش أحمل الصورة من الرابط ده. جرب ترفعها من الجهاز.");
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
          reader.readAsDataURL(file);
        }
      });
      return;
    }

    const items = e.dataTransfer.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'string') {
          item.getAsString(async (url) => {
            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || url.startsWith('http')) {
              await handleImageFromUrl(url);
            }
          });
        }
      }
    }

    const textData = e.dataTransfer.getData('text/plain');
    if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
      await handleImageFromUrl(textData);
    }

    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList) {
      const urls = uriList.split('\n').filter(url => url.trim() && !url.startsWith('#'));
      for (const url of urls) {
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
          await handleImageFromUrl(url);
        }
      }
    }
  }, [handleImageFromUrl]);

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

  const handleColorImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textData = e.dataTransfer.getData('text/plain');
    if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
      try {
        const response = await fetch(textData);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setNewColorImage(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (error) {
        alert("مقدرش أحمل الصورة من الرابط ده.");
      }
    }
  }, []);

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

  const handleAddSize = () => {
    if (!newLength || !newWidth || !newSizePrice) {
      alert("يجب إدخال الطول والعرض والسعر!");
      return;
    }
    setSizes([...sizes, { length: newLength, width: newWidth, price: newSizePrice }]);
    setNewLength("");
    setNewWidth("");
    setNewSizePrice("");
  };

  const handleRemoveSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalPrice = Number(formData.price);
    if (hasSizes && sizes.length > 0) {
      finalPrice = Number(sizes[0].price);
    }

    onSubmit({
      ...formData,
      price: finalPrice,
      originalPrice: Number(formData.originalPrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock) || 5, // ✅ إرسال الحد الأدنى
      images: imagePreviews,
      hasColors: hasColors,
      colors: hasColors ? colors : [],
      hasSizes: hasSizes,
      sizes: hasSizes ? sizes : [],
    });

    setFormData({ name: "", price: "", originalPrice: "", category: "", barcode: "", stock: "", description: "", minStock: "5" });
    setImagePreviews([]);
    setHasColors(false);
    setColors([]);
    setHasSizes(false);
    setSizes([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inputStyle = "w-full h-12 px-4 rounded-xl bg-transparent text-white border focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600";
  const borderConfig = { borderColor: "rgba(124,58,237,0.3)" };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-bold text-slate-400 mb-2">صور المنتج (متعدد)</label>
        <div className="flex flex-col gap-3">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition cursor-pointer ${
              isDragging 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-slate-600 hover:border-purple-400 hover:bg-purple-500/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={32} className={isDragging ? "text-purple-400" : "text-slate-500"} />
            <div className="text-center">
              <p className="text-sm text-slate-300 font-medium">
                {isDragging ? "أفلت الصور هنا..." : "اسحب الصور هنا أو اضغط لاختيارها"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                تقدر تسحب صور من الجهاز أو من أى موقع على النت! 🌐
              </p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={handleImageChange} 
              ref={fileInputRef} 
            />
          </div>
          
          <span className="text-xs text-slate-500">{imagePreviews.length} صور مختارة</span>
          
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
      
      {!hasSizes && (
        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="السعر *" required className={inputStyle} style={borderConfig} />
      )}
      
      <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="السعر قبل الخصم" className={inputStyle} style={borderConfig} />
      
      <div className="md:col-span-2">
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="اكتب وصف المنتج..." rows={3} className="w-full px-4 py-3 rounded-xl bg-transparent text-white border focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600 resize-none" style={borderConfig} />
      </div>

      <div className="md:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <Ruler size={16} className="text-purple-400" />
            هل المنتج بمقاسات مختلفة؟
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setHasSizes(false)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasSizes ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>لا</button>
            <button type="button" onClick={() => setHasSizes(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasSizes ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>نعم</button>
          </div>
        </div>
        
        {hasSizes && (
          <div className="mt-4 border-t border-slate-700 pt-4">
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {sizes.map((size, index) => (
                  <div key={index} className="relative group flex flex-col items-center gap-1 bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-300 font-bold">
                      {size.length} × {size.width} سم
                    </div>
                    <div className="text-sm text-purple-400 font-bold">
                      {size.price} جنيه
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSize(index)} 
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">الطول (سم)</label>
                <input 
                  type="number" 
                  value={newLength} 
                  onChange={(e) => setNewLength(e.target.value)} 
                  placeholder="مثال: 100" 
                  className="w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">العرض (سم)</label>
                <input 
                  type="number" 
                  value={newWidth} 
                  onChange={(e) => setNewWidth(e.target.value)} 
                  placeholder="مثال: 50" 
                  className="w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">السعر (جنيه)</label>
                <input 
                  type="number" 
                  value={newSizePrice} 
                  onChange={(e) => setNewSizePrice(e.target.value)} 
                  placeholder="مثال: 250" 
                  className="w-full h-10 px-3 rounded-lg text-sm bg-slate-800 border border-slate-700 text-white outline-none"
                />
              </div>
              <button 
                type="button" 
                onClick={handleAddSize} 
                className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1"
              >
                <Plus size={14} /> إضافة مقاس
              </button>
            </div>
          </div>
        )}
      </div>

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
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleColorImageDrop}
                    className="flex items-center gap-1"
                  >
                    <label className="flex items-center gap-1 h-10 px-2 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
                      <Upload size={14} className="text-purple-400" />
                      <span className="text-xs text-slate-400">{newColorImage ? "تم الاختيار" : "اختر صورة"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleColorImageChange} ref={colorFileInputRef} />
                    </label>
                  </div>
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
      
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="الكمية بالمخزن *" required className={inputStyle} style={borderConfig} />

      {/* ✅ حقل الحد الأدنى للتنبيه - مطلوب ومُسمى واضح */}
      <div className="relative">
        <input 
          type="number" 
          name="minStock" 
          value={formData.minStock} 
          onChange={handleChange} 
          placeholder="الحد الأدنى للتنبيه *" 
          required 
          className={inputStyle} 
          style={borderConfig} 
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-400">
          <AlertTriangle size={14} />
          <span className="text-[10px] font-bold">تنبيه</span>
        </div>
      </div>

      <div className="md:col-span-2 mt-2">
        <button type="submit" className="w-full h-14 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          <Save size={18} />
          حفظ المنتج في الداتابيز
        </button>
      </div>
    </form>
  );
}