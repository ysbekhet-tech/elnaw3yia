'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { isAuthenticated } from '@/lib/auth';
import {
  ArrowRight, Plus, Trash2, ChevronDown, ChevronUp,
  MapPin, Package, Save, Globe, Check, X
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  shipping: number;
}

interface Governorate {
  id: string;
  name: string;
  enabled: boolean;
  shipping: number; // مصاريف الشحن للمحافظة (لو مفيش مناطق)
  zones: Zone[];
}

export default function ShippingPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // حالات إضافة محافظة جديدة
  const [newGovName, setNewGovName] = useState('');
  const [newGovShipping, setNewGovShipping] = useState('');
  const [showAddGov, setShowAddGov] = useState(false);

  // حالات إضافة منطقة
  const [newZoneName, setNewZoneName] = useState<Record<string, string>>({});
  const [newZoneShipping, setNewZoneShipping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return; }
    setAuthChecked(true);

    const unsub = onSnapshot(collection(db, 'shipping'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Governorate));
      // ترتيب أبجدي
      data.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      setGovernorates(data);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // حفظ محافظة في Firebase
  const saveGov = async (gov: Governorate) => {
    setSaving(gov.id);
    try {
      await setDoc(doc(db, 'shipping', gov.id), {
        name: gov.name,
        enabled: gov.enabled,
        shipping: gov.shipping,
        zones: gov.zones,
      });
    } catch (e) { console.error(e); }
    finally { setSaving(null); }
  };

  // إضافة محافظة جديدة
  const handleAddGov = async () => {
    if (!newGovName.trim()) return;
    const id = `gov_${Date.now()}`;
    const newGov: Governorate = {
      id,
      name: newGovName.trim(),
      enabled: true,
      shipping: Number(newGovShipping) || 0,
      zones: [],
    };
    await setDoc(doc(db, 'shipping', id), {
      name: newGov.name,
      enabled: newGov.enabled,
      shipping: newGov.shipping,
      zones: [],
    });
    setNewGovName('');
    setNewGovShipping('');
    setShowAddGov(false);
  };

  // حذف محافظة
  const handleDeleteGov = async (govId: string) => {
    if (!confirm('هل تريد حذف هذه المحافظة؟')) return;
    await deleteDoc(doc(db, 'shipping', govId));
  };

  // تفعيل / إيقاف محافظة
  const handleToggleGov = async (gov: Governorate) => {
    const updated = { ...gov, enabled: !gov.enabled };
    await saveGov(updated);
  };

  // تحديث مصاريف الشحن للمحافظة
  const handleUpdateGovShipping = async (gov: Governorate, val: number) => {
    const updated = { ...gov, shipping: val };
    await saveGov(updated);
  };

  // إضافة منطقة داخل محافظة
  const handleAddZone = async (gov: Governorate) => {
    const name = newZoneName[gov.id]?.trim();
    const shipping = Number(newZoneShipping[gov.id]) || 0;
    if (!name) return;
    const zone: Zone = { id: `zone_${Date.now()}`, name, shipping };
    const updated = { ...gov, zones: [...gov.zones, zone] };
    await saveGov(updated);
    setNewZoneName(prev => ({ ...prev, [gov.id]: '' }));
    setNewZoneShipping(prev => ({ ...prev, [gov.id]: '' }));
  };

  // حذف منطقة
  const handleDeleteZone = async (gov: Governorate, zoneId: string) => {
    const updated = { ...gov, zones: gov.zones.filter(z => z.id !== zoneId) };
    await saveGov(updated);
  };

  // تحديث مصاريف منطقة
  const handleUpdateZoneShipping = async (gov: Governorate, zoneId: string, val: number) => {
    const updated = {
      ...gov,
      zones: gov.zones.map(z => z.id === zoneId ? { ...z, shipping: val } : z),
    };
    await saveGov(updated);
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen" style={{ background: '#050510' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/admin')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition font-bold text-sm mb-8"
        >
          <ArrowRight size={18} /> العودة للوحة التحكم
        </button>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Globe size={22} className="text-purple-400" /> إدارة مناطق الشحن
          </h1>
          <button
            onClick={() => setShowAddGov(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
          >
            <Plus size={16} /> إضافة محافظة
          </button>
        </div>

        {/* فورم إضافة محافظة */}
        {showAddGov && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <h3 className="text-white font-black mb-4">محافظة جديدة</h3>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="اسم المحافظة"
                value={newGovName}
                onChange={e => setNewGovName(e.target.value)}
                className="flex-1 min-w-[160px] bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-400 transition"
              />
              <input
                type="number"
                placeholder="مصاريف الشحن (ج)"
                value={newGovShipping}
                onChange={e => setNewGovShipping(e.target.value)}
                className="w-44 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-400 transition"
              />
              <button onClick={handleAddGov} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition flex items-center gap-2">
                <Save size={15} /> حفظ
              </button>
              <button onClick={() => setShowAddGov(false)} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-bold transition" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold">جاري التحميل...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {governorates.map(gov => (
              <div
                key={gov.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${gov.enabled ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}` }}
              >
                {/* هيدر المحافظة */}
                <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
                  {/* زرار التفعيل */}
                  <button
                    onClick={() => handleToggleGov(gov)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${gov.enabled ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-500'}`}
                    title={gov.enabled ? 'إخفاء من القائمة' : 'إظهار في القائمة'}
                  >
                    <Check size={15} />
                  </button>

                  {/* اسم المحافظة */}
                  <MapPin size={16} className={gov.enabled ? 'text-purple-400' : 'text-slate-600'} />
                  <span className={`font-black text-base flex-1 ${gov.enabled ? 'text-white' : 'text-slate-500'}`}>
                    {gov.name}
                  </span>

                  {/* مصاريف الشحن */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs font-bold">شحن المحافظة:</span>
                    <input
                      type="number"
                      value={gov.shipping}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setGovernorates(prev => prev.map(g => g.id === gov.id ? { ...g, shipping: val } : g));
                      }}
                      onBlur={e => handleUpdateGovShipping(gov, Number(e.target.value))}
                      className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-green-400 font-bold text-center outline-none focus:border-purple-400 transition"
                    />
                    <span className="text-slate-500 text-xs">ج</span>
                  </div>

                  {/* عدد المناطق */}
                  {gov.zones.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400">
                      {gov.zones.length} منطقة
                    </span>
                  )}

                  {/* زرار توسيع المناطق */}
                  <button
                    onClick={() => setExpandedId(expandedId === gov.id ? null : gov.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-purple-400 transition"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Package size={13} />
                    المناطق
                    {expandedId === gov.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {/* حذف محافظة */}
                  <button
                    onClick={() => handleDeleteGov(gov.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>

                  {saving === gov.id && (
                    <span className="text-xs text-purple-400 font-bold animate-pulse">جاري الحفظ...</span>
                  )}
                </div>

                {/* قائمة المناطق */}
                {expandedId === gov.id && (
                  <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="pt-4 flex flex-col gap-2">
                      {gov.zones.length === 0 ? (
                        <p className="text-slate-600 text-sm text-center py-2">لا توجد مناطق — سيتم استخدام مصاريف الشحن للمحافظة</p>
                      ) : (
                        gov.zones.map(zone => (
                          <div key={zone.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="flex-1 text-sm text-slate-300 font-bold">{zone.name}</span>
                            <input
                              type="number"
                              value={zone.shipping}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setGovernorates(prev => prev.map(g => g.id === gov.id ? {
                                  ...g,
                                  zones: g.zones.map(z => z.id === zone.id ? { ...z, shipping: val } : z)
                                } : g));
                              }}
                              onBlur={e => handleUpdateZoneShipping(gov, zone.id, Number(e.target.value))}
                              className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-green-400 font-bold text-center outline-none focus:border-purple-400 transition"
                            />
                            <span className="text-slate-500 text-xs">ج</span>
                            <button
                              onClick={() => handleDeleteZone(gov, zone.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))
                      )}

                      {/* إضافة منطقة جديدة */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <input
                          type="text"
                          placeholder="اسم المنطقة"
                          value={newZoneName[gov.id] || ''}
                          onChange={e => setNewZoneName(prev => ({ ...prev, [gov.id]: e.target.value }))}
                          className="flex-1 min-w-[130px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-400 transition"
                        />
                        <input
                          type="number"
                          placeholder="الشحن (ج)"
                          value={newZoneShipping[gov.id] || ''}
                          onChange={e => setNewZoneShipping(prev => ({ ...prev, [gov.id]: e.target.value }))}
                          className="w-28 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-400 transition"
                        />
                        <button
                          onClick={() => handleAddZone(gov)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition"
                        >
                          <Plus size={14} /> إضافة منطقة
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}