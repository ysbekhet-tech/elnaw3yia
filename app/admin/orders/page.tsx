'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, increment, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { isAuthenticated } from '@/lib/auth';
import { ShoppingCart, Ban, Calendar, ArrowRight, Bell, X, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

type OrderStatus = "new" | "processing" | "delivered" | "cancelled";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerArea: string;
  customerAddress: string;
  notes: string;
  paymentMethod: string;
  items: { id: string; name: string; price: number; quantity: number; image: string }[];
  total: number;
  shippingCost: number;
  status: OrderStatus;
  createdAt: any;
}

const formatFirebaseDate = (timestamp: any) => {
  if (!timestamp) return 'غير محدد';
  try {
    return timestamp.toDate().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'غير محدد';
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // حالات التنبيه
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [lastNewOrderId, setLastNewOrderId] = useState<string | null>(null);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // 🔥 حالة الصوت محفوظة في localStorage عشان تفضل بعد الرجوع للصفحة
  const [isAudioAllowed, setIsAudioAllowed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioAllowed') === 'true';
    }
    return false;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔊 تهيئة ملف الصوت مرة واحدة مع تفعيل التكرار
  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // 🔊 شغّل أو وقّف الصوت بناءً على وجود طلبات جديدة
  useEffect(() => {
    if (!isAudioAllowed || !audioRef.current) return;

    const hasNewOrders = orders.some((o) => o.status === 'new');

    if (hasNewOrders) {
      audioRef.current.play().catch((err) => console.log('خطأ في تشغيل الصوت:', err));
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [orders, isAudioAllowed]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/admin/login');
      return;
    }
    setAuthChecked(true);

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      setOrders(data);
      setLoading(false);

      const currentIds = new Set(data.map((o) => o.id));
      const newIds: string[] = [];

      currentIds.forEach((id) => {
        if (!prevOrderIdsRef.current.has(id)) {
          newIds.push(id);
        }
      });

      if (newIds.length > 0 && prevOrderIdsRef.current.size > 0) {
        setLastNewOrderId(newIds[0]);
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 7000);
      }

      prevOrderIdsRef.current = currentIds;
    });

    return () => unsubscribe();
  }, [router]);

  // دالة قبول الطلب
  const handleAcceptOrder = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'processing' });
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleCancelOrder = (order: Order) => {
    setModalConfig({
      isOpen: true,
      title: 'إلغاء الطلب',
      message: 'هل أنت متأكد من إلغاء هذا الطلب بالكامل؟ سيتم حذفه وإرجاع الكميات للمخزن.',
      onConfirm: () => executeCancelOrder(order),
    });
  };

  const executeCancelOrder = async (order: Order) => {
    try {
      const updatePromises = order.items.map((item) =>
        updateDoc(doc(db, 'products', item.id), { stock: increment(item.quantity) })
      );
      await Promise.all(updatePromises);
      await deleteDoc(doc(db, 'orders', order.id));
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('خطأ في إلغاء الطلب:', error);
      setModalConfig({
        isOpen: true,
        title: 'خطأ',
        message: 'حدث خطأ أثناء إلغاء الطلب',
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  // دالة تغيير حالة الصوت مع الحفظ في localStorage
  const handleToggleAudio = () => {
    const newState = !isAudioAllowed;
    setIsAudioAllowed(newState);
    localStorage.setItem('audioAllowed', String(newState)); // 🔥 احفظ الحالة

    if (audioRef.current) {
      if (newState) {
        // صوت تجريبي لتجاوز حظر المتصفح
        audioRef.current.play().then(() => {
          const hasNewOrders = orders.some((o) => o.status === 'new');
          if (!hasNewOrders) {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
          }
        }).catch((e) => console.log('خطأ تشغيل تجريبي:', e));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen" style={{ background: '#050510' }}>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmText="تأكيد الحذف"
        cancelText="رجوع"
      />

      {/* 🔔 إشعار الطلب الجديد */}
      {newOrderAlert && lastNewOrderId && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <Link
            href={`/admin/orders/${lastNewOrderId}`}
            onClick={() => setNewOrderAlert(false)}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl animate-bounce cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              boxShadow: '0 0 30px rgba(124,58,237,0.5)',
              textDecoration: 'none',
            }}
          >
            <Bell size={20} className="text-white" />
            <p className="text-white font-black text-sm">🔔 تنبيه: تم استلام طلب جديد! اضغط للتفاصيل</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                setNewOrderAlert(false);
              }}
              className="text-white/80 hover:text-white ml-2"
            >
              <X size={16} />
            </button>
          </Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/admin')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition font-bold text-sm mb-8"
        >
          <ArrowRight size={18} /> العودة للوحة التحكم
        </button>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShoppingCart size={20} className="text-purple-400" /> إدارة الطلبات
            </h2>

            {/* زر تفعيل / كتم الصوت */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                isAudioAllowed
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
              style={{ border: `1px solid ${isAudioAllowed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}
            >
              {isAudioAllowed ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {isAudioAllowed ? 'التنبيهات مفعلة (صوت)' : 'التنبيهات مكتومة (صامت)'}
            </button>
          </div>

          {/* رسالة تنبيه للمستخدم إذا كان الصوت مكتوماً */}
          {!isAudioAllowed && (
            <div
              className="mb-6 p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <VolumeX size={20} className="text-red-400 shrink-0" />
              <p className="text-slate-400 text-sm font-bold">
                الصوت مكتوم حالياً. لكي تسمع تنبيه الطلبات الجديدة، اضغط على زر &quot;التنبيهات مكتومة&quot; بالأعلى لتفعيل الصوت.
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-slate-500 font-bold">جاري تحميل الطلبات...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-bold">لا توجد طلبات حتى الآن</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-slate-300 min-w-[1000px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
                    <th className="py-3 px-4 font-black text-slate-400">الحالة</th>
                    <th className="py-3 px-4 font-black text-slate-400">رقم الطلب</th>
                    <th className="py-3 px-4 font-black text-slate-400">العميل</th>
                    <th className="py-3 px-4 font-black text-slate-400">الهاتف</th>
                    <th className="py-3 px-4 font-black text-slate-400">الإجمالي</th>
                    <th className="py-3 px-4 font-black text-slate-400">التاريخ</th>
                    <th className="py-3 px-4 font-black text-slate-400">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b border-slate-800 hover:bg-slate-800/30 transition ${
                        order.status === 'new' ? 'bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 w-fit ${
                            order.status === 'new'
                              ? 'bg-yellow-500/20 text-yellow-400 animate-pulse'
                              : order.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-400'
                              : order.status === 'delivered'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {order.status === 'new'
                            ? '🆕 طلب جديد'
                            : order.status === 'processing'
                            ? '⏳ جاري التجهيز'
                            : order.status === 'delivered'
                            ? '✅ تم التوصيل'
                            : '🚫 ملغي'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs text-purple-400 hover:text-purple-300 hover:underline transition"
                        >
                          #{order.id.slice(0, 6)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{order.customerName}</td>
                      <td className="py-3 px-4" dir="ltr">
                        {order.customerPhone}
                      </td>
                      <td className="py-3 px-4 font-black text-green-400">{order.total} ج</td>
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-purple-500" />
                          {formatFirebaseDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'new' && (
                            <button
                              onClick={() => handleAcceptOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition text-xs font-bold"
                              style={{ border: '1px solid rgba(34,197,94,0.3)' }}
                            >
                              <CheckCircle size={13} /> تم القبول
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition text-xs font-bold"
                            style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            <Ban size={13} /> إلغاء
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}