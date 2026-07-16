"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ImageIcon, Upload, Plus, Trash2, X, Pencil, RotateCcw, Eye, EyeOff, Power, GalleryHorizontalEnd, Link as LinkIcon } from "lucide-react";

type HeroSlide = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  showImage: boolean;
  duration: number;
  isActive: boolean;
  order?: number;
};

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSliderEnabled, setIsSliderEnabled] = useState(true);
  const [showDefaultHero, setShowDefaultHero] = useState(true);

  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [duration, setDuration] = useState(10);
  const [showImage, setShowImage] = useState(true);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const unsubSlides = onSnapshot(collection(db, "heroSlides"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HeroSlide[];
      // ترتيب حسب الـ order أو حسب العنوان
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSlides(list);
    });

    const unsubConfig = onSnapshot(doc(db, "settings", "heroConfig"), (snap) => {
      if (snap.exists()) {
        setIsSliderEnabled(snap.data().isVisible !== false);
        setShowDefaultHero(snap.data().showDefaultHero !== false);
      }
    });

    return () => {
      unsubSlides();
      unsubConfig();
    };
  }, []);

  const toggleGlobalSlider = async () => {
    const newStatus = !isSliderEnabled;
    await setDoc(doc(db, "settings", "heroConfig"), { isVisible: newStatus }, { merge: true });
  };

  const toggleDefaultHero = async () => {
    const newStatus = !showDefaultHero;
    await setDoc(doc(db, "settings", "heroConfig"), { showDefaultHero: newStatus }, { merge: true });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingSlideId(null);
    setTitle("");
    setDescription("");
    setLink("");
    setDuration(10);
    setShowImage(true);
    setImageBase64("");
    setImageFile(null);
    setIsActive(true);
  };

  const handleEditClick = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setTitle(slide.title);
    setDescription(slide.description || "");
    setLink(slide.link || "");
    setDuration(slide.duration);
    setShowImage(slide.showImage);
    setImageBase64(slide.image || "");
    setImageFile(null);
    setIsActive(slide.isActive !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!title.trim() && !imageBase64) return;

    try {
      setUploading(true);

      let finalImageUrl = imageBase64;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("folder", "heroSlides");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.message || "فشل رفع الصورة");
        }

        const data = await uploadRes.json();
        finalImageUrl = data.url;
      }

      const slideData = {
        title,
        description,
        image: finalImageUrl,
        link,
        showImage,
        duration: Number(duration) || 10,
        isActive,
        order: slides.length,
      };

      if (editingSlideId) {
        const slideDoc = doc(db, "heroSlides", editingSlideId);
        await updateDoc(slideDoc, slideData);
      } else {
        await addDoc(collection(db, "heroSlides"), slideData);
      }

      resetForm();
    } catch (error: any) {
      console.error("خطأ في حفظ الشريحة:", error);
      alert(`حدث خطأ أثناء الحفظ: ${error.message || error}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleSlideStatus = async (slide: HeroSlide) => {
    const newStatus = slide.isActive === false ? true : false;
    const slideDoc = doc(db, "heroSlides", slide.id);
    await updateDoc(slideDoc, { isActive: newStatus });
  };

  const deleteSlide = async (id: string) => {
    if (editingSlideId === id) resetForm();
    await deleteDoc(doc(db, "heroSlides", id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <GalleryHorizontalEnd size={24} className="text-indigo-600" />
            إدارة سلايدر الصفحة الرئيسية 🖼️
          </h1>

        </div>

        {/* أزرار التحكم */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={toggleDefaultHero}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 ${
              showDefaultHero 
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100" 
                : "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            {showDefaultHero ? <Eye size={18} /> : <EyeOff size={18} />}
            {showDefaultHero ? "البانر الأساسي: ظاهر" : "البانر الأساسي: مخفي"}
          </button>
          <button
            onClick={toggleGlobalSlider}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 ${
              isSliderEnabled 
                ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" 
                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            }`}
          >
            <Power size={18} />
            {isSliderEnabled ? "الشرائح الإضافية: مفعّلة" : "الشرائح الإضافية: متوقفة"}
          </button>
        </div>

        {/* ملاحظة توضيحية */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 text-sm text-indigo-700 font-medium">
          <p>💡 جميع الحقول اختيارية ما عدا الصورة أو العنوان (لازم واحد منهم على الأقل). لو عايز ترفع صورة مصممة جاهزة من غير نصوص — ارفع الصورة بس وسيب باقي الحقول فاضية.</p>
        </div>

        {/* نموذج الإضافة/التعديل */}
        <div className="rounded-2xl p-6 mb-8 bg-white border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {editingSlideId ? <Pencil size={18} className="text-yellow-500" /> : <Plus size={18} className="text-indigo-500" />}
              {editingSlideId ? "تعديل الشريحة" : "إضافة شريحة جديدة"}
            </h2>
            {editingSlideId && (
              <button onClick={resetForm} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition">
                <RotateCcw size={14} /> إلغاء التعديل
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="عنوان الشريحة (اختياري)" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 px-4 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 border border-indigo-200 bg-indigo-50/50 focus:border-indigo-400 transition" />
              <input type="number" placeholder="المدة بالثواني" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-12 px-4 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 border border-indigo-200 bg-indigo-50/50 focus:border-indigo-400 transition" />
            </div>

            <textarea placeholder="الوصف (اختياري)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="px-4 py-3 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 resize-none border border-indigo-200 bg-indigo-50/50 focus:border-indigo-400 transition" />

            <div className="flex items-center gap-2">
              <LinkIcon size={16} className="text-indigo-500 flex-shrink-0" />
              <input placeholder="الرابط عند الضغط على الشريحة (اختياري) مثال: /products أو /offers" value={link} onChange={(e) => setLink(e.target.value)} className="flex-1 h-12 px-4 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 border border-indigo-200 bg-indigo-50/50 focus:border-indigo-400 transition" />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 px-4 h-12 rounded-xl cursor-pointer transition hover:bg-indigo-100 bg-indigo-50 border border-indigo-200">
                <Upload size={16} className="text-indigo-600" />
                <span className="text-sm text-slate-700">{editingSlideId ? "تغيير الصورة" : "رفع صورة"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {imageBase64 ? (
                <div className="relative w-20 h-12 rounded-xl overflow-hidden border border-indigo-300 flex-shrink-0">
                  <img src={imageBase64} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImageBase64(""); setImageFile(null); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"><X size={12} /></button>
                </div>
              ) : (
                editingSlideId && <span className="text-xs text-slate-400">لا توجد صورة</span>
              )}

              <div className="flex items-center gap-4 mr-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm text-slate-600">عرض الصورة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm text-slate-600">مفعّل</span>
                </label>
              </div>
            </div>

            <button onClick={handleSave} disabled={uploading} className="h-12 px-6 rounded-xl font-bold text-white text-sm transition hover:opacity-90 disabled:opacity-50" style={{ background: editingSlideId ? "linear-gradient(135deg, #d97706, #f59e0b)" : "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {uploading ? 'جاري الحفظ...' : editingSlideId ? 'حفظ التعديلات' : 'إضافة الشريحة'}
            </button>
          </div>
        </div>

        {/* الشرائح الحالية */}
        <div className="rounded-2xl p-6 bg-white border border-indigo-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">الشرائح الحالية ({slides.length})</h2>
          
          {slides.length === 0 ? (
            <div className="text-center py-10">
              <GalleryHorizontalEnd size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">لا توجد شرائح إضافية حالياً</p>
              <p className="text-slate-300 text-sm mt-1">الصورة الأساسية الثابتة ستظهر فقط</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slides.map((slide) => {
                const isSlideActive = slide.isActive !== false;
                return (
                  <div 
                    key={slide.id} 
                    className={`p-4 rounded-xl flex gap-4 items-center group transition bg-slate-50 border border-slate-200 ${editingSlideId === slide.id ? 'ring-2 ring-yellow-400' : ''} ${!isSlideActive ? 'opacity-50 grayscale' : ''}`}
                  >
                    <button 
                      onClick={() => toggleSlideStatus(slide)} 
                      className={`p-1 rounded-lg transition flex-shrink-0 ${isSlideActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      title={isSlideActive ? 'إخفاء هذه الشريحة' : 'تفعيل هذه الشريحة'}
                    >
                      {isSlideActive ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    {slide.image ? (
                      <img src={slide.image} alt={slide.title} className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-200">
                        <ImageIcon size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-900 font-bold text-sm truncate">{slide.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">المدة: {slide.duration} ث | {isSlideActive ? 'مفعّل' : 'معطّل'}{slide.link ? ` | رابط: ${slide.link}` : ''}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleEditClick(slide)} className="text-blue-600 hover:text-blue-500 transition p-1" title="تعديل"><Pencil size={18} /></button>
                      <button onClick={() => deleteSlide(slide.id)} className="text-red-500 hover:text-red-400 transition p-1" title="حذف"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
