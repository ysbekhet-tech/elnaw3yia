"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function BackupButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleBackup = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/backup");

      if (!res.ok) {
        throw new Error("فشل في جلب البيانات");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // استخراج اسم الملف من الـ header
      const contentDisposition = res.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "firestore-backup.json";

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus("success");
    } catch (error) {
      console.error("Backup error:", error);
      setStatus("error");
    } finally {
      setLoading(false);
      // إخفاء الحالة بعد 3 ثواني
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleBackup}
        disabled={loading}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
          ${loading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }
          text-white shadow-lg hover:shadow-xl
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري النسخ الاحتياطي...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            نسخ احتياطي لـ Firestore
          </>
        )}
      </button>

      {status === "success" && (
        <div className="flex items-center gap-1 text-green-600 text-sm animate-pulse">
          <CheckCircle className="w-4 h-4" />
          تم التحميل بنجاح!
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          حدث خطأ، حاول مرة أخرى
        </div>
      )}
    </div>
  );
}