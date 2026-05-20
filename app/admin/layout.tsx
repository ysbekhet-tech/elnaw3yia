'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { clearAuthToken, isAuthenticated } from '@/lib/auth';
import { LogOut, ShieldCheck, Package, ShoppingCart, Megaphone, Bell, X, Truck, Tags, Home, Menu } from 'lucide-react';

interface Order { id: string; status: string; }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/admin/login';
  
  const [authChecked, setAuthChecked] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevOrdersCount = useRef(0);

  useEffect(() => {
    if (isLoginPage) return; 

    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);
    
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      
      // ✅ فلترة الطلبات: إزالة طلبات الـ POS اللي بتبدأ بـ pos_
      const websiteOrders = allData.filter(order => !order.id.startsWith('pos'));
      
      if (prevOrdersCount.current > 0 && websiteOrders.length > prevOrdersCount.current) {
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 5000);
      }
      prevOrdersCount.current = websiteOrders.length;
    });
    return () => unsubscribe();
  }, [isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }} />
      </div>
    );
  }

  const menuItems = [
    { title: 'الرئيسية', icon: Home, href: '/admin' },
    { title: 'إدارة المنتجات', icon: Package, href: '/admin/products' },
    { title: 'إدارة الطلبات', icon: ShoppingCart, href: '/admin/orders' },
    { title: 'الإعلانات', icon: Megaphone, href: '/admin/ads' },
    { title: 'إدارة الشحن', icon: Truck, href: '/admin/shipping' },
    { title: 'العروض والجديد', icon: Tags, href: '/admin/features' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {newOrderAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-3 rounded-2xl animate-bounce" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}>
          <Bell size={20} className="text-white" />
          <p className="text-white font-black text-sm">تنبيه: تم استلام طلب جديد!</p>
          <button onClick={() => setNewOrderAlert(false)} className="text-white/80 hover:text-white ml-2"><X size={16}/></button>
        </div>
      )}

      {/* زرار فتح الـ Sidebar في الموبايل */}
      <button onClick={() => setSidebarOpen(true)} className="md:hidden fixed top-4 left-4 z-30 bg-white p-2 rounded-xl shadow-md border border-slate-200">
        <Menu size={24} className="text-slate-900" />
      </button>

      {/* الـ Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 shadow-sm flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">المكتبة النوعية</h1>
              <p className="text-xs text-slate-500">لوحة التحكم</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-900"><X size={20}/></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.title}
                onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
                  isActive 
                    ? 'bg-purple-50 text-purple-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-purple-600' : 'text-slate-400'} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <button onClick={() => { clearAuthToken(); router.push('/admin/login'); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition font-bold text-sm border border-red-200">
            <LogOut size={17} /><span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* خلفية داكنة للموبايل */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* منطقة عرض المحتوى */}
      <main className="md:pr-72 min-h-screen transition-all duration-300">
        <div className="p-6 md:p-10">
          {children}
        </div>
      </main>

    </div>
  );
}