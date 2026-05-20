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

  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [lastNewOrderId, setLastNewOrderId] = useState<string | null>(null);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  const [isAudioAllowed, setIsAudioAllowed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioAllowed') === 'true';
    }
    return false;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

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

  const handleToggleAudio = () => {
    const newState = !isAudioAllowed;
    setIsAudioAllowed(newState);
    localStorage.setItem('audioAllowed', String(newState));

    if (audioRef.current) {
      if (newState) {
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
    <div className="min-h-screen bg-slate-50">
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmText="تأكيد الحذف"
        cancelText="رجوع"
      />

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
          className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition font-bold text-sm mb-8"
        >
          <ArrowRight size={18} /> العودة للوحة التحكم
        </button>

        <div className="rounded-2xl p-6 bg-white border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart size={20} className="text-purple-600" /> إدارة الطلبات
            </h2>

            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                isAudioAllowed
                  ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
            >
              {isAudioAllowed ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {isAudioAllowed ? 'التنبيهات مفعلة (صوت)' : 'التنبيهات مكتومة (صامت)'}
            </button>
          </div>

          {!isAudioAllowed && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 border border-red-200">
              <VolumeX size={20} className="text-red-500 shrink-0" />
              <p className="text-slate-600 text-sm font-bold">
                الصوت مكتوم حالياً. لكي تسمع تنبيه الطلبات الجديدة، اضغط على زر "التنبيهات مكتومة" بالأعلى لتفعيل الصوت.
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-slate-400 font-bold">جاري تحميل الطلبات...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات حتى الآن</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-slate-700 min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 font-black text-slate-500">الحالة</th>
                    <th className="py-3 px-4 font-black text-slate-500">رقم الطلب</th>
                    <th className="py-3 px-4 font-black text-slate-500">العميل</th>
                    <th className="py-3 px-4 font-black text-slate-500">الهاتف</th>
                    <th className="py-3 px-4 font-black text-slate-500">الإجمالي</th>
                    <th className="py-3 px-4 font-black text-slate-500">التاريخ</th>
                    <th className="py-3 px-4 font-black text-slate-500">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                        order.status === 'new' ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 w-fit ${
                            order.status === 'new'
                              ? 'bg-yellow-100 text-yellow-700 animate-pulse'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
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
                          className="font-mono text-xs text-purple-600 hover:text-purple-500 hover:underline transition"
                        >
                          #{order.id.slice(0, 6)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{order.customerName}</td>
                      <td className="py-3 px-4" dir="ltr">
                        {order.customerPhone}
                      </td>
                      <td className="py-3 px-4 font-black text-green-600">{order.total} ج</td>
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-purple-600" />
                          {formatFirebaseDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'new' && (
                            <button
                              onClick={() => handleAcceptOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-600 hover:bg-green-50 transition text-xs font-bold border border-green-200"
                            >
                              <CheckCircle size={13} /> تم القبول
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition text-xs font-bold border border-red-200"
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