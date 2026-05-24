"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { uploadBase64Image } from "@/lib/uploadImage";
import { Database, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  const startMigration = async () => {
    if (!confirm("هل أنت متأكد؟ ده هيحول كل الصور القديمة (Base64) لروابط Cloudinary. العملية دي ممكن تأخذ وقت حسب عدد المنتجات.")) return;

    setIsMigrating(true);
    setLogs([]);
    setProgress(0);

    try {
      addLog("🔍 جاري جلب المنتجات من الداتابيز...");
      const productsSnapshot = await getDocs(collection(db, "products"));
      const products = productsSnapshot.docs;
      setTotal(products.length);

      addLog(`✅ تم العثور على ${products.length} منتج. بدء الفحص والتحويل...`);

      for (let i = 0; i < products.length; i++) {
        const productDoc = products[i];
        const productData = productDoc.data();
        let needsUpdate = false;
        const updatedData: any = { ...productData };

        // 1. فحص صور المنتج الرئيسية (images array)
        if (Array.isArray(updatedData.images)) {
          const newImages: string[] = [];
          for (const img of updatedData.images) {
            if (typeof img === "string" && img.startsWith("data:")) {
              try {
                addLog(`⏳ رفع صورة للمنتج: ${productData.name}...`);
                const url = await uploadBase64Image(img, `products/${productDoc.id}`);
                newImages.push(url);
                needsUpdate = true;
              } catch (error) {
                addLog(`❌ فشل رفع صورة للمنتج ${productData.name}`);
                newImages.push(img); // نحتفظ بالقديمة لو حصل خطأ
              }
            } else {
              newImages.push(img); // صورة عادية (URL)، نسيبها زي ما هي
            }
          }
          updatedData.images = newImages;
        }

        // 2. فحص الصورة القديمة المفردة (image string) لو موجودة
        if (typeof updatedData.image === "string" && updatedData.image.startsWith("data:")) {
          try {
            addLog(`⏳ رفع الصورة القديمة المفردة للمنتج: ${productData.name}...`);
            const url = await uploadBase64Image(updatedData.image, `products/${productDoc.id}`);
            updatedData.images = updatedData.images || [];
            updatedData.images.unshift(url); // نحطها في الأول
            delete updatedData.image; // نمسح القديم
            needsUpdate = true;
          } catch (error) {
            addLog(`❌ فشل رفع الصورة المفردة للمنتج ${productData.name}`);
          }
        }

        // 3. فحص صور الألوان (colors array)
        if (Array.isArray(updatedData.colors)) {
          const newColors: any[] = [];
          for (const color of updatedData.colors) {
            const newColor = { ...color };
            if (typeof newColor.image === "string" && newColor.image.startsWith("data:")) {
              try {
                addLog(`⏳ رفع صورة لون (${newColor.name}) للمنتج: ${productData.name}...`);
                const url = await uploadBase64Image(newColor.image, `products/${productDoc.id}/colors`);
                newColor.image = url;
                needsUpdate = true;
              } catch (error) {
                addLog(`❌ فشل رفع صورة اللون للمنتج ${productData.name}`);
              }
            }
            newColors.push(newColor);
          }
          updatedData.colors = newColors;
        }

        // 4. تحديث الداتابيز لو حصل أى تغيير
        if (needsUpdate) {
          // بنشيل الحقول اللي Firebase مش بيقبلها في التحديث
          delete updatedData.id; 
          await updateDoc(doc(db, "products", productDoc.id), updatedData);
          addLog(`✅ تم تحديث المنتج بنجاح: ${productData.name}`);
        } else {
          addLog(`⏭️ المنتج لا يحتاج تحديث: ${productData.name}`);
        }

        setProgress(i + 1);
        
        // تأخير بسيط عشان مظغطش على الـ API
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      addLog("🎉 انتهت عملية التحويل بنجاح!");
    } catch (error) {
      console.error(error);
      addLog("🚨 حصل خطأ عام أثناء التحويل!");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="bg-white border border-yellow-300 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Database size={20} className="text-yellow-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">نقل البيانات القديمة (Migration)</h3>
          <p className="text-xs text-slate-500">تحويل صور Base64 القديمة إلى روابط Cloudinary</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-800 flex gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <strong>تنبيه مهم:</strong> هذه العملية تُنفّذ مرة واحدة فقط. تأكد من أخذ نسخة احتياطية من Firestore قبل البدء إذا كانت بياناتك كبيرة جداً. لا تغلق الصفحة أثناء التحويل.
        </div>
      </div>

      <button
        onClick={startMigration}
        disabled={isMigrating}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
          isMigrating ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
      >
        {isMigrating ? (
          <>
            <Loader2 size={16} className="animate-spin" /> جاري التحويل...
          </>
        ) : (
          <>
            <Database size={16} /> بدء نقل الصور القديمة
          </>
        )}
      </button>

      {total > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
            <span>التقدم</span>
            <span>{progress} / {total}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4 bg-slate-900 rounded-xl p-4 max-h-[300px] overflow-y-auto text-xs text-green-400 font-mono leading-relaxed">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}