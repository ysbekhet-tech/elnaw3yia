"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Megaphone, Upload, Plus, Trash2, X, Image as ImageIcon, Pencil, RotateCcw, Eye, EyeOff, Power, ArrowRight } from "lucide-react";

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
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(10);
  const [showImage, setShowImage] = useState(true);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ad[];
      setAds(list);
    });

    const unsubConfig = onSnapshot(doc(db, "settings", "bannerConfig"), (snap) => {
      if (snap.exists()) {
        setIsBannerVisible(snap.data().isVisible !== false);
      }
    });

    return () => {
      unsubAds();
      unsubConfig();
    };
  }, []);

  const toggleGlobalBanner = async () => {
    const newStatus = !isBannerVisible;
    await setDoc(doc(db, "settings", "bannerConfig"), { isVisible: newStatus }, { merge: true });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingAdId(null);
    setTitle("");
    setDescription("");
    setDuration(10);
    setShowImage(true);
    setImageBase64("");
    setIsActive(true);
  };

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

  const toggleAdStatus = async (ad: Ad) => {
    const newStatus = ad.isActive === false ? true : false;
    const adDoc = doc(db, "ads", ad.id);
    await updateDoc(adDoc, { isActive: newStatus });
  };

  const deleteAd = async (id: string) => {
    if (editingAdId === id) resetForm();
    await deleteDoc(doc(db, "ads", id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
      

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Megaphone size={24} className="text-purple-600" />
            إدارة الإعلانات 🔥
          </h1>

          <button
            onClick={toggleGlobalBanner}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 ${
              isBannerVisible 
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
            }`}
          >
            <Power size={18} />
            {isBannerVisible ? "إيقاف تشغيل البانر من المتجر" : "تشغيل ظهور البانر في المتجر"}
          </button>
        </div>

        <div className="rounded-2xl p-6 mb-8 bg-white border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {editingAdId ? <Pencil size={18} className="text-yellow-500" /> : <Plus size={18} className="text-pink-500" />}
              {editingAdId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
            </h2>
            {editingAdId && (
              <button onClick={resetForm} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition">
                <RotateCcw size={14} /> إلغاء التعديل
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="عنوان الإعلان *" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 px-4 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 border border-purple-200 bg-purple-50/50 focus:border-purple-400 transition" />
              <input type="number" placeholder="المدة بالثواني" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-12 px-4 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 border border-purple-200 bg-purple-50/50 focus:border-purple-400 transition" />
            </div>

            <textarea placeholder="الوصف (اختياري)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="px-4 py-3 rounded-xl text-slate-900 text-sm outline-none placeholder:text-slate-400 resize-none border border-purple-200 bg-purple-50/50 focus:border-purple-400 transition" />

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 px-4 h-12 rounded-xl cursor-pointer transition hover:bg-purple-100 bg-purple-50 border border-purple-200">
                <Upload size={16} className="text-purple-600" />
                <span className="text-sm text-slate-700">{editingAdId ? "تغيير الصورة" : "رفع صورة"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {imageBase64 ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-300 flex-shrink-0">
                  <img src={imageBase64} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImageBase64("")} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"><X size={12} /></button>
                </div>
              ) : (
                editingAdId && <span className="text-xs text-slate-400">لا توجد صورة</span>
              )}

              <div className="flex items-center gap-4 mr-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-slate-600">عرض الصورة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm text-slate-600">مفعّل</span>
                </label>
              </div>
            </div>

            <button onClick={handleSave} disabled={uploading} className="h-12 px-6 rounded-xl font-bold text-white text-sm transition hover:opacity-90 disabled:opacity-50" style={{ background: editingAdId ? "linear-gradient(135deg, #d97706, #f59e0b)" : "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              {uploading ? 'جاري الحفظ...' : editingAdId ? 'حفظ التعديلات' : 'إضافة الإعلان'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-6 bg-white border border-purple-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">الإعلانات الحالية ({ads.length})</h2>
          
          {ads.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-5">لا توجد إعلانات حالياً</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map((ad) => {
                const isAdActive = ad.isActive !== false;
                return (
                  <div 
                    key={ad.id} 
                    className={`p-4 rounded-xl flex gap-4 items-center group transition bg-slate-50 border border-slate-200 ${editingAdId === ad.id ? 'ring-2 ring-yellow-400' : ''} ${!isAdActive ? 'opacity-50 grayscale' : ''}`}
                  >
                    <button 
                      onClick={() => toggleAdStatus(ad)} 
                      className={`p-1 rounded-lg transition flex-shrink-0 ${isAdActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      title={isAdActive ? 'إخفاء هذا الإعلان' : 'تفعيل هذا الإعلان'}
                    >
                      {isAdActive ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    {ad.image ? (
                      <img src={ad.image} alt={ad.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-200">
                        <ImageIcon size={24} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-900 font-bold text-sm truncate">{ad.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">المدة: {ad.duration} ث | {isAdActive ? 'مفعّل' : 'معطّل'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleEditClick(ad)} className="text-blue-600 hover:text-blue-500 transition p-1" title="تعديل"><Pencil size={18} /></button>
                      <button onClick={() => deleteAd(ad.id)} className="text-red-500 hover:text-red-400 transition p-1" title="حذف"><Trash2 size={18} /></button>
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