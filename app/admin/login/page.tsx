'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateAdmin, setAuthToken, isAuthenticated } from '@/lib/auth';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLogin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (authenticateAdmin(code)) {
      setAuthToken();
      // ✅ الحل هنا: بنستخدم window.location.replace عشان نعمل تحديث كامل للصفحة
      // وبيضمن إن الـ Dashboard يقرأ الـ Token فوراً من غير ما يعمل لوب أو يحتاج Refresh
      window.location.replace('/admin');
      return; // بنوقف هنا عشان ميكملش باقي الكود
    } else {
      setError('الكود غير صحيح، حاول مرة أخرى');
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 60%), #050510",
      }}
    >
      {/* Glow background blobs */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)", filter: "blur(80px)" }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ec4899, transparent)", filter: "blur(80px)" }}
      />

      <div
        className="w-full max-w-md rounded-3xl p-8 relative"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(124,58,237,0.3)",
          boxShadow: "0 0 60px rgba(124,58,237,0.15), 0 25px 60px rgba(0,0,0,0.5)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}
          >
            <Shield size={36} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center text-white mb-1">لوحة التحكم</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">أدخل كود الوصول للمتابعة</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              <Lock size={13} className="inline ml-1" />
              كود الوصول
            </label>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="أدخل كود الوصول السري"
                autoComplete="new-password"
                className="w-full px-4 py-3.5 pr-12 rounded-2xl outline-none text-white placeholder-slate-600 text-sm transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(124,58,237,0.3)",
                }}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm font-bold text-red-400 flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full text-white font-bold py-4 rounded-2xl text-base transition active:scale-95 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: code && !loading ? "0 0 30px rgba(124,58,237,0.4)" : "none",
            }}
          >
            {loading ? "جاري التحقق..." : "دخول للوحة التحكم"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-8">
          🔒 هذه الصفحة محمية — فقط المسؤولون
        </p>
      </div>
    </div>
  );
}