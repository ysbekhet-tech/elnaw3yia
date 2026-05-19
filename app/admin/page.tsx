'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { clearAuthToken, isAuthenticated } from '@/lib/auth';
import { LogOut, ShieldCheck, Package, ShoppingCart, Megaphone, Bell, X, Truck, Tags } from 'lucide-react'; // ✅ استبدلنا Tag و Sparkles بـ Tags

interface Order { id: string; status: string; }

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrdersCount = useRef(0);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      if (prevOrdersCount.current > 0 && data.length > prevOrdersCount.current) {
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 5000);
      }
      prevOrdersCount.current = data.length;
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => { clearAuthToken(); router.push('/admin/login'); };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }} />
      </div>
    );
  }

  const cards = [
    { title: 'إدارة المنتجات', desc: 'إضافة وتعديل الأقسام والمنتجات', icon: Package, href: '/admin/products', color: '#7c3aed' },
    { title: 'إدارة الطلبات', desc: 'متابعة الطلبات الجديدة وتحديث الحالة', icon: ShoppingCart, href: '/admin/orders', color: '#ec4899' },
    { title: 'الإعلانات', desc: 'إدارة الإعلانات والعروض', icon: Megaphone, href: '/admin/ads', color: '#f59e0b' },
    { title: 'إدارة الشحن', desc: 'تحديد مناطق التوصيل والمصاريف', icon: Truck, href: '/admin/shipping', color: '#06b6d4' },
    // ✅ الكارت الجديد اللي بيجمع العروض والجديد
    { title: 'العروض والجديد', desc: 'تحديد منتجات العروض والوصول حديثاً', icon: Tags, href: '/admin/features', color: '#f97316' },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      {newOrderAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl animate-bounce" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}>
          <Bell size={20} className="text-white" />
          <p className="text-white font-black text-sm">تنبيه: تم استلام طلب جديد!</p>
          <button onClick={() => setNewOrderAlert(false)} className="text-white/80 hover:text-white ml-2"><X size={16}/></button>
        </div>
      )}

      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(5,5,16,0.95)", borderColor: "rgba(124,58,237,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">لوحة تحكم المتجر</h1>
              <p className="text-xs text-slate-500">المكتبة النوعية</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition font-bold text-sm" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
            <LogOut size={17} /><span>خروج</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-black text-white text-center mb-2">مرحباً بك في لوحة التحكم</h2>
        <p className="text-slate-400 text-center mb-12">اختر القسم الذي تريد إدارته</p>
        
        {/* ✅ عدلنا الـ grid عشان يظبط مع عدد الكروت الجديد (5 كروت) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className="group rounded-3xl p-8 text-center transition hover:scale-105"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 30px ${card.color}30`}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 0px ${card.color}00`}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition" style={{ background: `${card.color}20` }}>
                <card.icon size={32} style={{ color: card.color }} />
              </div>
              <h3 className="text-xl font-black text-white mb-2">{card.title}</h3>
              <p className="text-sm text-slate-400">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}