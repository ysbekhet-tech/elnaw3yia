'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { ArrowRight, User, Phone, MapPin, CreditCard, Package, Trash2, Plus, Minus, Ban, Calendar, Truck, CheckCircle, Printer, Pencil, X, Save } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface OrderItem { id: string; name: string; price: number; quantity: number; image: string; }
interface Order {
  id: string; customerName: string; customerPhone: string; customerArea: string; customerAddress: string; notes: string; paymentMethod: string; items: OrderItem[]; total: number; shippingCost: number; createdAt: any; status?: string; deliveryPerson?: string;
}

const formatFirebaseDate = (timestamp: any) => {
  if (!timestamp) return 'غير محدد';
  try { return timestamp.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } 
  catch (e) { return 'غير محدد'; }
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryPersonName, setDeliveryPersonName] = useState("");

  // حالات تعديل التليفون والعنوان
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState("");

  useEffect(() => { if (id) fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try { setLoading(true); const docRef = doc(db, 'orders', id as string); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setOrder({ id: docSnap.id, ...docSnap.data() } as Order); } else { router.push('/admin'); } } 
    catch (error) { console.error('خطأ في جلب الطلب:', error); } 
    finally { setLoading(false); }
  };

  // دالة تحديث بيانات العميل (تليفون وعنوان)
  const handleUpdateCustomerInfo = async (field: 'customerPhone' | 'customerAddress', value: string) => {
    if (!order || !value.trim()) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), { [field]: value.trim() });
      setOrder(prev => prev ? { ...prev, [field]: value.trim() } : null);
      if (field === 'customerPhone') setIsEditingPhone(false);
      if (field === 'customerAddress') setIsEditingAddress(false);
    } catch (error) {
      console.error('خطأ في التحديث:', error);
      alert("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setUpdating(false);
    }
  };

  const handleQuantityChange = async (itemId: string, currentQty: number, change: number) => {
    if (!order) return; const newQty = currentQty + change; if (newQty < 1) return;
    setUpdating(true);
    try {
      const itemIndex = order.items.findIndex(i => i.id === itemId); if (itemIndex === -1) return;
      await updateDoc(doc(db, 'products', itemId), { stock: increment(-change) });
      const updatedItems = [...order.items]; updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: newQty };
      const newItemsTotal = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const newGrandTotal = newItemsTotal + order.shippingCost;
      await updateDoc(doc(db, 'orders', order.id), { items: updatedItems, total: newGrandTotal });
      setOrder({ ...order, items: updatedItems, total: newGrandTotal });
    } catch (error) { console.error('خطأ في تعديل الكمية:', error); } 
    finally { setUpdating(false); }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!order) return; const item = order.items.find(i => i.id === itemId); if (!item) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'products', itemId), { stock: increment(item.quantity) });
      const updatedItems = order.items.filter(i => i.id !== itemId);
      if (updatedItems.length === 0) { await deleteDoc(doc(db, 'orders', order.id)); router.push('/admin'); return; }
      const newItemsTotal = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const newGrandTotal = newItemsTotal + order.shippingCost;
      await updateDoc(doc(db, 'orders', order.id), { items: updatedItems, total: newGrandTotal });
      setOrder({ ...order, items: updatedItems, total: newGrandTotal });
    } catch (error) { console.error('خطأ في حذف المنتج:', error); } 
    finally { setUpdating(false); setModalConfig({ ...modalConfig, isOpen: false }); }
  };

  const handleCancelEntireOrder = async () => {
    if (!order) return; setUpdating(true);
    try {
      const updatePromises = order.items.map((item) => updateDoc(doc(db, 'products', item.id), { stock: increment(item.quantity) }));
      await Promise.all(updatePromises); await deleteDoc(doc(db, 'orders', order.id)); router.push('/admin');
    } catch (error) { console.error('خطأ في إلغاء الطلب:', error); setUpdating(false); setModalConfig({ ...modalConfig, isOpen: false }); }
  };

  const handleConfirmPrepared = async () => {
    if (!deliveryPersonName.trim()) { alert("من فضلك أدخل اسم المندوب"); return; }
    if (!order) return; setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'delivered', deliveryPerson: deliveryPersonName.trim() });
      setOrder(prev => prev ? { ...prev, status: 'delivered', deliveryPerson: deliveryPersonName.trim() } : null);
      setShowDeliveryModal(false); setDeliveryPersonName("");
    } catch (error) { console.error('خطأ في تحديث الحالة:', error); } 
    finally { setUpdating(false); }
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}><div className="w-12 h-12 rounded-full animate-spin" style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }} /></div>;
  if (!order) return null;

  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 2mm; margin: 0; background: white !important; color: black !important; font-family: Arial, sans-serif; font-size: 12px; }
          .no-print { display: none !important; }
          .print-black { color: black !important; border-color: black !important; }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: "#050510" }}>
        <ConfirmModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })} />

        {showDeliveryModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="w-full max-w-md rounded-3xl p-8 relative" style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.4)" }}>
              <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2"><Truck size={20} className="text-purple-400" /> تأكيد التجهيز والتوصيل</h2>
              <p className="text-slate-400 text-sm mb-5">أدخل اسم المندوب المسؤول:</p>
              <input type="text" value={deliveryPersonName} onChange={(e) => setDeliveryPersonName(e.target.value)} placeholder="اسم المندوب..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition text-white mb-6" autoFocus />
              <div className="flex gap-3">
                <button onClick={handleConfirmPrepared} disabled={updating} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-bold py-3 rounded-xl transition">{updating ? "جاري الحفظ..." : "موافق - تم التوصيل"}</button>
                <button onClick={() => setShowDeliveryModal(false)} className="px-5 py-3 rounded-xl text-slate-400 hover:text-white transition font-bold" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>إلغاء</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-10 no-print">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <Link href="/admin/orders" className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition font-bold text-sm"><ArrowRight size={18} /> العودة لقائمة الطلبات</Link>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-blue-400 hover:bg-blue-500/10 transition font-bold text-sm" style={{ border: "1px solid rgba(59,130,246,0.3)" }}><Printer size={16} /> طباعة</button>
              <button onClick={() => setModalConfig({ isOpen: true, title: 'إلغاء الطلب', message: 'هل أنت متأكد؟ سيتم حذفه نهائياً وإرجاع المنتجات.', onConfirm: handleCancelEntireOrder })} disabled={updating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition font-bold text-sm disabled:opacity-50" style={{ border: "1px solid rgba(239,68,68,0.3)" }}><Ban size={16} /> إلغاء الطلب</button>
            </div>
          </div>

          <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">تفاصيل الطلب <span className="text-purple-400">#{order.id.slice(0, 6)}</span></h1>
              <div className="flex items-center gap-2 text-slate-400 text-sm"><Calendar size={16} className="text-purple-500" /><span>{formatFirebaseDate(order.createdAt)}</span></div>
            </div>
            <div className="flex flex-col items-end gap-3">
              {order.status === 'delivered' ? (
                <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/50 px-4 py-2 rounded-xl"><CheckCircle size={18} className="text-green-400" /><span className="text-green-400 font-bold text-sm">تم التوصيل ({order.deliveryPerson})</span></div>
              ) : (
                <button onClick={() => setShowDeliveryModal(true)} disabled={updating} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}><Truck size={16} /> تم تجهيز الطلب</button>
              )}
            </div>
          </div>
        </div>

        {/* منطقة الفاتورة */}
        <div id="printable-area" className="max-w-4xl mx-auto px-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "1.5rem", padding: "1.5rem" }}>
          
          <div className="text-center mb-6 print-black">
            <h1 className="text-2xl font-black text-white print-black">المكتبة النوعية</h1>
            <p className="text-sm text-slate-400 print-black mt-1">فاتورة طلب</p>
            <div className="border-b border-dashed border-slate-600 print-black my-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="print-black">
              <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2 print-black"><User size={18} className="text-purple-400" /> بيانات العميل</h2>
              <div className="space-y-3 text-sm print-black">
                <p className="text-slate-300 print-black"><span className="text-slate-500 font-bold ml-2">الاسم:</span> {order.customerName}</p>
                
                {/* تعديل التليفون */}
                <div className="flex items-center gap-2 print-black">
                  <span className="text-slate-500 font-bold ml-2 no-print">الهاتف:</span>
                  {isEditingPhone ? (
                    <div className="flex items-center gap-1 flex-1 no-print">
                      <input type="tel" value={editedPhone} onChange={(e) => setEditedPhone(e.target.value)} className="flex-1 bg-slate-700 border border-purple-500 rounded-lg px-2 py-1 text-white text-sm outline-none" dir="ltr" />
                      <button onClick={() => handleUpdateCustomerInfo('customerPhone', editedPhone)} className="p-1 text-green-400 hover:text-green-300"><Save size={16} /></button>
                      <button onClick={() => setIsEditingPhone(false)} className="p-1 text-red-400 hover:text-red-300"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 print-black">
                      <span className="text-slate-300 print-black" dir="ltr">{order.customerPhone}</span>
                      <button onClick={() => { setEditedPhone(order.customerPhone); setIsEditingPhone(true); }} className="text-purple-400 hover:text-purple-300 no-print"><Pencil size={14} /></button>
                    </div>
                  )}
                </div>

                {/* تعديل العنوان */}
                <div className="flex items-center gap-2 print-black">
                  <span className="text-slate-500 font-bold ml-2 no-print">العنوان:</span>
                  {isEditingAddress ? (
                    <div className="flex items-center gap-1 flex-1 no-print">
                      <input type="text" value={editedAddress} onChange={(e) => setEditedAddress(e.target.value)} className="flex-1 bg-slate-700 border border-purple-500 rounded-lg px-2 py-1 text-white text-sm outline-none" />
                      <button onClick={() => handleUpdateCustomerInfo('customerAddress', editedAddress)} className="p-1 text-green-400 hover:text-green-300"><Save size={16} /></button>
                      <button onClick={() => setIsEditingAddress(false)} className="p-1 text-red-400 hover:text-red-300"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 print-black">
                      <span className="text-slate-300 print-black">{order.customerArea} - {order.customerAddress}</span>
                      <button onClick={() => { setEditedAddress(`${order.customerArea} - ${order.customerAddress}`); setIsEditingAddress(true); }} className="text-purple-400 hover:text-purple-300 no-print"><Pencil size={14} /></button>
                    </div>
                  )}
                </div>

              </div>
            </div>
            <div className="print-black">
              <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2 print-black"><CreditCard size={18} className="text-purple-400" /> الدفع والتوصيل</h2>
              <div className="space-y-2 text-sm print-black">
                <p className="text-slate-300 print-black"><span className="text-slate-500 font-bold ml-2">الطريقة:</span> 💵 كاش عند الاستلام</p>
                <p className="text-slate-300 print-black"><span className="text-slate-500 font-bold ml-2">التاريخ:</span> {formatFirebaseDate(order.createdAt)}</p>
                {order.deliveryPerson && <p className="text-green-400 print-black"><span className="text-slate-500 font-bold ml-2">المندوب:</span> {order.deliveryPerson}</p>}
                {order.notes && <div className="mt-2 p-2 rounded-lg bg-amber-900/20 border border-amber-700/30 print-black"><p className="text-amber-400 font-bold text-xs print-black">📝 {order.notes}</p></div>}
              </div>
            </div>
          </div>

          <div className="print-black">
            <div className="border-b border-dashed border-slate-600 print-black mb-4"></div>
            <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2 print-black"><Package size={18} className="text-purple-400" /> المنتجات</h2>
            
            <div className="flex flex-col gap-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg print-black relative">
                  <div className="flex-1 min-w-0 print-black"><p className="font-bold text-white text-sm print-black">{item.name}</p></div>
                  <div className="flex items-center gap-1 no-print">
                    <button onClick={() => handleQuantityChange(item.id, item.quantity, -1)} disabled={updating} className="w-7 h-7 rounded-md bg-slate-600 hover:bg-red-500/30 flex items-center justify-center text-slate-300 transition disabled:opacity-50"><Minus size={12} /></button>
                    <span className="text-sm font-black text-white min-w-[20px] text-center print-black">{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.id, item.quantity, 1)} disabled={updating} className="w-7 h-7 rounded-md bg-slate-600 hover:bg-purple-500/30 flex items-center justify-center text-slate-300 transition disabled:opacity-50"><Plus size={12} /></button>
                  </div>
                  <p className="font-black text-green-400 text-sm whitespace-nowrap min-w-[60px] text-left print-black">{item.price * item.quantity} ج</p>
                  <button onClick={() => setModalConfig({ isOpen: true, title: 'حذف المنتج', message: `حذف "${item.name}" وإرجاع الكمية؟`, onConfirm: () => handleRemoveItem(item.id) })} disabled={updating} className="absolute top-1 left-1 text-slate-600 hover:text-red-500 transition disabled:opacity-50 no-print"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700 mt-4 pt-4 flex flex-col gap-1 print-black">
            <div className="flex justify-between text-sm text-slate-400 print-black"><span>المنتجات</span><span>{itemsTotal} ج</span></div>
            <div className="flex justify-between text-sm text-slate-400 print-black"><span>الشحن</span><span className="text-orange-400 font-bold print-black">{order.shippingCost} ج</span></div>
            <div className="flex justify-between text-xl font-black text-white mt-2 pt-2 border-t-2 border-dashed border-slate-600 print-black"><span>الإجمالي</span><span className="text-purple-400 print-black">{order.total} ج</span></div>
          </div>
        </div>
      </div>
    </>
  );
}