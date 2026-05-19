"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // تم الإضافة
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
import { Megaphone, Upload, Plus, Trash2, X, Image as ImageIcon, Pencil, RotateCcw, Eye, EyeOff, Power, ArrowRight } from "lucide-react"; // تم إضافة ArrowRight

type Ad = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  showImage: boolean;
  duration: number;
  isActive: boolean;
};

export default function AdminAdsPage() {
  const router = useRouter(); // تم الإضافة
  const [ads, setAds] = useState<Ad[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true); // حالة البانر العام

  // Form State
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(10);
  const [showImage, setShowImage] = useState(true);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // 🔥 جلب الإعلانات + جلب إعداد ظهور البانر
  useEffect(() => {
    // 1. جلب الإعلانات
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ad[];
      setAds(list);
    });

    // 2. جلب إعداد ظهور البانر من مجموعة settings
    const unsubConfig = onSnapshot(doc(db, "settings", "bannerConfig"), (snap) => {
      if (snap.exists()) {
        setIsBannerVisible(snap.data().isVisible !== false); // لو مش موجود يبقى true
      }
    });

    return () => {
      unsubAds();
      unsubConfig();
    };
  }, []);

  // 🔄 تغيير حالة ظهور البانر ككل
  const toggleGlobalBanner = async () => {
    const newStatus = !isBannerVisible;
    // نحفظ الإعداد في وثيقة اسمها bannerConfig داخل مجموعة settings
    await setDoc(doc(db, "settings", "bannerConfig"), { isVisible: newStatus }, { merge: true });
  };

  // 📸 التعامل مع اختيار الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 🔄 تفريغ الفورم
  const resetForm = () => {
    setEditingAdId(null);
    setTitle("");
    setDescription("");
    setDuration(10);
    setShowImage(true);
    setImageBase64("");
    setIsActive(true);
  };

  // ✏️ تعبئة الفورم للتعديل
  const handleEditClick = (ad: Ad) => {
    setEditingAdId(ad.id);
    setTitle(ad.title);
    setDescription(ad.description || "");
    setDuration(ad.duration);
    setShowImage(ad.showImage);
    setImageBase64(ad.image || "");
    setIsActive(ad.isActive !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ➕ إضافة إعلان أو ✏️ تعديله
  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      setUploading(true);

      const adData = {
        title,
        description,
        image: imageBase64,
        showImage,
        duration: Number(duration) || 10,
        isActive,
      };

      if (editingAdId) {
        const adDoc = doc(db, "ads", editingAdId);
        await updateDoc(adDoc, adData);
      } else {
        await addDoc(collection(db, "ads"), adData);
      }

      resetForm();
    } catch (error: any) {
      console.error("خطأ في حفظ الإعلان:", error);
      alert(`حدث خطأ أثناء الحفظ: ${error.message || error}`);
    } finally {
      setUploading(false);
    }
  };

  // 🔄 تغيير حالة التفعيل للإعلان الواحد
  const toggleAdStatus = async (ad: Ad) => {
    const newStatus = ad.isActive === false ? true : false;
    const adDoc = doc(db, "ads", ad.id);
    await updateDoc(adDoc, { isActive: newStatus });
  };

  // 🗑 حذف إعلان
  const deleteAd = async (id: string) => {
    if (editingAdId === id) resetForm();
    await deleteDoc(doc(db, "ads", id));
  };

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* زرار العودة للوحة التحكم */}
        <button 
          onClick={() => router.push('/admin')} 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition font-bold text-sm mb-8"
        >
          <ArrowRight size={18} /> العودة للوحة التحكم
        </button>

        {/* Header مع زرار التشغيل/الإيقاف العام */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Megaphone size={24} className="text-purple-400" />
            إدارة الإعلانات 🔥
          </h1>

          <button
            onClick={toggleGlobalBanner}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 ${
              isBannerVisible 
                ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" 
                : "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
            }`}
          >
            <Power size={18} />
            {isBannerVisible ? "إيقاف تشغيل البانر من المتجر" : "تشغيل ظهور البانر في المتجر"}
          </button>
        </div>

        {/* فورم إضافة / تعديل إعلان */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {editingAdId ? <Pencil size={18} className="text-yellow-400" /> : <Plus size={18} className="text-pink-400" />}
              {editingAdId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
            </h2>
            {editingAdId && (
              <button onClick={resetForm} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                <RotateCcw size={14} /> إلغاء التعديل
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="عنوان الإعلان *" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 px-4 rounded-xl text-white text-sm outline-none placeholder:text-slate-600" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }} />
              <input type="number" placeholder="المدة بالثواني" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-12 px-4 rounded-xl text-white text-sm outline-none placeholder:text-slate-600" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }} />
            </div>

            <textarea placeholder="الوصف (اختياري)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="px-4 py-3 rounded-xl text-white text-sm outline-none placeholder:text-slate-600 resize-none" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }} />

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 px-4 h-12 rounded-xl cursor-pointer transition hover:bg-purple-500/20" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <Upload size={16} className="text-purple-400" />
                <span className="text-sm text-white">{editingAdId ? "تغيير الصورة" : "رفع صورة"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {imageBase64 ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-400 flex-shrink-0">
                  <img src={imageBase64} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImageBase64("")} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"><X size={12} /></button>
                </div>
              ) : (
                editingAdId && <span className="text-xs text-slate-500">لا توجد صورة</span>
              )}

              <div className="flex items-center gap-4 mr-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-slate-300">عرض الصورة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm text-slate-300">مفعّل</span>
                </label>
              </div>
            </div>

            <button onClick={handleSave} disabled={uploading} className="h-12 px-6 rounded-xl font-bold text-white text-sm transition hover:opacity-90 disabled:opacity-50" style={{ background: editingAdId ? "linear-gradient(135deg, #d97706, #f59e0b)" : "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              {uploading ? 'جاري الحفظ...' : editingAdId ? 'حفظ التعديلات' : 'إضافة الإعلان'}
            </button>
          </div>
        </div>

        {/* عرض الإعلانات الحالية */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <h2 className="text-lg font-bold text-white mb-5">الإعلانات الحالية ({ads.length})</h2>
          
          {ads.length === 0 ? (
            <p className="text-center text-slate-600 font-bold py-5">لا توجد إعلانات حالياً</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map((ad) => {
                const isAdActive = ad.isActive !== false;
                return (
                  <div 
                    key={ad.id} 
                    className={`p-4 rounded-xl flex gap-4 items-center group transition ${editingAdId === ad.id ? 'ring-2 ring-yellow-500' : ''} ${!isAdActive ? 'opacity-50 grayscale' : ''}`}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    <button 
                      onClick={() => toggleAdStatus(ad)} 
                      className={`p-1 rounded-lg transition flex-shrink-0 ${isAdActive ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-600 hover:bg-slate-500/10'}`}
                      title={isAdActive ? 'إخفاء هذا الإعلان' : 'تفعيل هذا الإعلان'}
                    >
                      {isAdActive ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    {ad.image ? (
                      <img src={ad.image} alt={ad.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800">
                        <ImageIcon size={24} className="text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate">{ad.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">المدة: {ad.duration} ث | {isAdActive ? 'مفعّل' : 'معطّل'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleEditClick(ad)} className="text-blue-400 hover:text-blue-300 transition p-1" title="تعديل"><Pencil size={18} /></button>
                      <button onClick={() => deleteAd(ad.id)} className="text-red-400 hover:text-red-300 transition p-1" title="حذف"><Trash2 size={18} /></button>
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