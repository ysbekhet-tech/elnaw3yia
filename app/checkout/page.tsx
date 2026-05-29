"use client";

import { useState, useRef, useEffect } from "react";
import { useCart } from "@/app/context/CartContext";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  serverTimestamp,
  doc,
  onSnapshot,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  User,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

// ---- أنواع البيانات ----
interface Zone {
  id: string;
  name: string;
  shipping: number;
}
interface Governorate {
  id: string;
  name: string;
  enabled: boolean;
  shipping: number;
  zones?: Zone[]; // جعلنا zones اختيارياً لتتوافق مع TypeScript
}

const CART_EXPIRY_MINUTES = 10;
const CART_EXPIRY_MS = CART_EXPIRY_MINUTES * 60 * 1000;

export default function CheckoutPage() {
  const { cart, cartTotal, removeFromCart, addToCart, clearLocalCart } = useCart();
  const router = useRouter();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [shippingLoading, setShippingLoading] = useState(true);

  const [selectedGovId, setSelectedGovId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");

  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [otpError, setOtpError] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "shipping"), (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Governorate)
      );
      const enabled = data
        .filter((g) => g.enabled)
        .sort((a, b) => a.name.localeCompare(b.name, "ar"));
      setGovernorates(enabled);
      setShippingLoading(false);
    });
    return () => unsub();
  }, []);

  const selectedGov = governorates.find((g) => g.id === selectedGovId);
  const selectedZone = selectedGov?.zones?.find((z) => z.id === selectedZoneId);
  
  // ✅ إصلاح: إضافة ? قبل length لتجنب خطأ TypeScript
  const shippingCost = selectedGov
    ? (selectedGov.zones?.length || 0) > 0
      ? selectedZone?.shipping ?? 0
      : selectedGov.shipping
    : 0;

  const grandTotal = (Number(cartTotal) || 0) + (Number(shippingCost) || 0);

  // ✅ إصلاح: إضافة ? قبل length
  const isFormValid =
    selectedGovId &&
    ((selectedGov?.zones?.length || 0) === 0 || selectedZoneId) &&
    form.customerName.trim() &&
    form.customerPhone.trim() &&
    form.customerAddress.trim();

  const handleOtpChange = (element: any, index: number) => {
    if (isNaN(element.value)) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== "") otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && otp[index] === "")
      otpRefs.current[index - 1]?.focus();
  };

  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        const recaptchaContainer =
          document.getElementById("recaptcha-container");
        if (!recaptchaContainer) return null;
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
              recaptchaVerifierRef.current = null;
            },
          }
        );
      } catch {
        return null;
      }
    }
    return recaptchaVerifierRef.current;
  };

  const validateStockBeforeCheckout = async (): Promise<boolean> => {
    setStockError(null);
    try {
      for (const item of cart) {
        if (!item.id) {
          setStockError(`المنتج "${item.name}" لا يحتوي على معرف صالح`);
          return false;
        }
        const now = Date.now();
        if (now - item.addedAt >= CART_EXPIRY_MS) {
          setStockError(`انتهت صلاحية حجز المنتج "${item.name}"، رجّع أضفه للسلة`);
          return false;
        }
        const ref = doc(db, "products", item.id);
        const snap = await getDoc(ref);
        
        if (!snap.exists()) {
          setStockError(`المنتج "${item.name}" لم يعد متوفراً`);
          return false;
        }
        const data = snap.data();
        const currentStock = data.stock || 0;
        const currentReserved = data.reserved || 0;
        const myReservation = item.quantity;
        const availableForMe = currentStock - currentReserved + myReservation;

        if (availableForMe < item.quantity) {
          setStockError(
            `المنتج "${item.name}" نفذت كميته المتاحة. المتبقي: ${currentStock - currentReserved} قطعة`
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      setStockError("حدث خطأ في التحقق من المخزون، حاول تاني");
      return false;
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!selectedGovId) return alert("من فضلك اختر المحافظة");
    // ✅ إصلاح: إضافة ? قبل length
    if ((selectedGov?.zones?.length || 0) > 0 && !selectedZoneId)
      return alert("من فضلك اختر المنطقة");

    setLoading(true);
    try {
      const stockOk = await validateStockBeforeCheckout();
      if (!stockOk) {
        setLoading(false);
        return;
      }

      let phone = form.customerPhone.trim().replace(/[^\d+]/g, "");
      let localPhone = phone;
      if (localPhone.startsWith("+20"))
        localPhone = "0" + localPhone.substring(3);
      else if (localPhone.startsWith("20"))
        localPhone = "0" + localPhone.substring(2);
      else if (!localPhone.startsWith("0"))
        localPhone = "0" + localPhone;
      if (localPhone.length !== 11 || !localPhone.startsWith("0"))
        throw new Error(
          "رقم الهاتف غير صحيح، يجب أن يكون 11 رقم يبدأ بـ 0"
        );

      let firebasePhone = localPhone.replace(/^0/, "+20");
      if (firebasePhone.length !== 13)
        throw new Error("حدث خطأ في تنسيق رقم الهاتف");

      setForm((prev) => ({ ...prev, customerPhone: localPhone }));
      const appVerifier = setupRecaptcha();
      if (!appVerifier) throw new Error("فشل تهيئة reCAPTCHA");

      const result = await signInWithPhoneNumber(
        auth,
        firebasePhone,
        appVerifier
      );
      setConfirmationResult(result);
      setStep("otp");
    } catch (error: any) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      alert(error?.message || "حصل خطأ في إرسال كود التحقق");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setOtpError("من فضلك أدخل الكود كامل");
      return;
    }

    setLoading(true);
    setOtpError("");
    setStockError(null);
    try {
      if (!confirmationResult) {
        setStep("form");
        return;
      }
      await confirmationResult.confirm(otpCode);

      const orderRef = doc(collection(db, "orders"));
      const order = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerArea: selectedZone
          ? `${selectedGov?.name} - ${selectedZone.name}`
          : selectedGov?.name || "",
        customerAddress: form.customerAddress,
        notes: form.notes,
        paymentMethod: "cash",
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          selectedColor: item.selectedColor || "",
          selectedSize: item.selectedSize ? `${item.selectedSize.length} × ${item.selectedSize.width}` : "",
          sizeExtraPrice: Number(item.selectedSize?.price) || 0,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          image: item.images?.[0] || item.image || "",
        })),
        total: grandTotal,
        shippingCost,
        status: "new",
        createdAt: serverTimestamp(),
      };

      await runTransaction(db, async (transaction) => {
        for (const item of cart) {
          if (!item.id) {
            throw new Error(`المنتج "${item.name}" لا يحتوي على معرف صالح`);
          }
          const ref = doc(db, "products", item.id);
          const snap = await transaction.get(ref);
          
          if (!snap.exists()) {
            throw new Error(`المنتج "${item.name}" لم يعد متوفراً`);
          }

          const data = snap.data();
          const currentStock = data.stock || 0;
          const currentReserved = data.reserved || 0;
          const myReservation = item.quantity;
          const availableForMe = currentStock - currentReserved + myReservation;

          if (availableForMe < item.quantity) {
            throw new Error(
              `المنتج "${item.name}" نفذت كميته المتاحة. المتبقي: ${currentStock - currentReserved} قطعة`
            );
          }

          transaction.update(ref, {
            stock: currentStock - item.quantity,
            reserved: Math.max(0, currentReserved - myReservation),
            purchased: (data.purchased || 0) + item.quantity,
          });
        }

        transaction.set(orderRef, order);
      });

      clearLocalCart();
      setOrderId(orderRef.id);
      setSuccess(true);
    } catch (error: any) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      if (error?.message?.includes("نفذت كميته") || error?.message?.includes("لم يعد متوفراً") || error?.message?.includes("انتهت صلاحية")) {
        setStockError(error.message);
      } else if (error?.message?.includes("لا يحتوي على معرف صالح")) {
        setStockError(error.message);
      } else if (error?.code === "auth/invalid-verification-code") {
        setOtpError("الكود غير صحيح، حاول تاني");
      } else if (error?.code === "auth/code-expired") {
        setOtpError("انتهت صلاحية الكود، حاول إرسال كود جديد");
      } else {
        alert("حصل خطأ أثناء حفظ الطلب، حاول تاني");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-slate-800 rounded-3xl p-10 shadow-lg border border-slate-700">
          <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">تم استلام طلبك!</h1>
          <p className="text-slate-400 mb-2">رقم الطلب:</p>
          <p className="text-purple-400 font-bold text-sm mb-6 break-all">{orderId}</p>
          <p className="text-slate-400 mb-8">سنتواصل معك قريباً على رقم الهاتف المسجل</p>
          <button onClick={() => router.push("/")} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl transition">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart size={64} className="text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-white mb-4">السلة فاضية!</h1>
        <button onClick={() => router.push("/")} className="bg-purple-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-purple-700 transition">
          تسوق الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-white mb-8">إتمام الشراء</h1>
      <div id="recaptcha-container"></div>

      {stockError && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-400">
          <AlertTriangle size={24} />
          <div>
            <p className="font-bold">{stockError}</p>
            <button onClick={() => router.push("/products")} className="text-sm underline hover:text-red-300">
              العودة للمنتجات
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ---- فورم البيانات ---- */}
        <div className="flex flex-col gap-5">
          {step === "form" && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                  <User size={20} className="text-purple-400" /> بيانات التوصيل
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-300 mb-1 block">الاسم الكامل *</label>
                    <input type="text" required placeholder="اكتب اسمك الكامل" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition text-white" />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 mb-1 block">
                      <Phone size={14} className="inline ml-1" /> رقم الهاتف *
                    </label>
                    <input type="tel" required placeholder="01012345678" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition text-white" />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 mb-1 block">
                      <MapPin size={14} className="inline ml-1" /> المحافظة *
                    </label>
                    {shippingLoading ? (
                      <div className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-500">جاري التحميل...</div>
                    ) : (
                      <select required value={selectedGovId} onChange={(e) => { setSelectedGovId(e.target.value); setSelectedZoneId(""); }} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition text-white">
                        <option value="" className="bg-slate-700">اختر المحافظة...</option>
                        {governorates.map((gov) => (
                          <option key={gov.id} value={gov.id} className="bg-slate-700">
                            {/* ✅ إصلاح: إضافة ? قبل length */}
                            {gov.name}{(!gov.zones || gov.zones.length === 0) ? ` — شحن ${gov.shipping} ج` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* ✅ إصلاح: إضافة ? قبل length */}
                  {selectedGov && selectedGov.zones && selectedGov.zones.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-slate-300 mb-1 block">
                        <MapPin size={14} className="inline ml-1" /> المنطقة *
                      </label>
                      <select required value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition text-white">
                        <option value="" className="bg-slate-700">اختر المنطقة...</option>
                        {selectedGov.zones.map((zone) => (
                          <option key={zone.id} value={zone.id} className="bg-slate-700">
                            {zone.name} — شحن {zone.shipping} ج
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-bold text-slate-300 mb-1 block">العنوان بالتفصيل *</label>
                    <textarea required placeholder="اسم الشارع، رقم البناية، الدور..." value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition resize-none h-20 text-white" />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 mb-1 block">
                      <FileText size={14} className="inline ml-1" /> ملاحظات (اختياري)
                    </label>
                    <textarea placeholder="أي ملاحظات إضافية..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition resize-none h-16 text-white" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || !isFormValid} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg transition flex items-center justify-center gap-2">
                {loading ? "جاري المعالجة..." : "إتمام الشراء"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleSubmitOrder} className="flex flex-col gap-5">
              <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                <button type="button" onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); setOtpError(""); setStockError(null); }} className="text-slate-400 hover:text-white flex items-center gap-1 mb-4 text-sm">
                  <ArrowRight size={16} /> تعديل البيانات
                </button>
                <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                  <ShieldCheck size={24} className="text-purple-400" /> تأكيد رقم الهاتف
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  تم إرسال كود مكون من 6 أرقام إلى رقمك
                  <span className="text-white font-bold mr-1">{form.customerPhone}</span>
                </p>
                <div className="flex justify-center gap-2 mb-4" dir="ltr">
                  {otp.map((data, index) => (
                    <input key={index} type="text" inputMode="numeric" maxLength={1} ref={(el) => { otpRefs.current[index] = el; }} value={data} onChange={(e) => handleOtpChange(e.target, index)} onKeyDown={(e) => handleOtpKeyDown(e, index)} onFocus={(e) => e.target.select()} className="w-12 h-14 bg-slate-700 border-2 border-slate-600 rounded-xl text-center text-white text-xl font-black outline-none focus:border-purple-400 transition" />
                  ))}
                </div>
                {otpError && <p className="text-red-400 text-sm text-center mb-2">{otpError}</p>}
                <div className="text-center">
                  <button type="button" onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }} className="text-purple-400 text-sm hover:underline">
                    لم تستلم الكود؟ إعادة الإرسال
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-bold py-4 rounded-2xl text-lg transition flex items-center justify-center gap-2">
                {loading ? "جاري التحقق وإرسال الطلب..." : `تأكيد الطلب — ${grandTotal} ج`}
              </button>
            </form>
          )}
        </div>

        {/* ---- ملخص الطلب ---- */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 h-fit sticky top-24">
          <h2 className="text-xl font-black text-white mb-5">ملخص الطلب</h2>
          <div className="flex flex-col gap-3 mb-5">
            {cart.map((item) => {
              const itemPrice = Number(item.price) || 0;
              const itemQuantity = Number(item.quantity) || 0;

              return (
                <div key={`${item.id}-${item.selectedColor || ""}-${item.selectedSize?.length || ""}-${item.selectedSize?.width || ""}`} className="flex items-center gap-3 bg-slate-700 p-3 rounded-xl">
                  <img src={item.images?.[0] || item.image || "https://via.placeholder.com/60"} alt={item.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm line-clamp-1">{item.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedColor && <span className="text-purple-400 text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full">{item.selectedColor}</span>}
                      {item.selectedSize && <span className="text-blue-400 text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">{item.selectedSize.length} × {item.selectedSize.width}</span>}
                    </div>
                    <p className="text-purple-400 text-xs font-bold mt-1">{itemPrice} ج للقطعة</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-black text-purple-400 text-sm whitespace-nowrap">{itemPrice * itemQuantity} ج</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { if (!item.id) return; removeFromCart(item.id, item.selectedColor, item.selectedSize); }} className="w-6 h-6 rounded-lg bg-slate-600 hover:bg-red-500/30 hover:text-red-400 flex items-center justify-center text-slate-300 transition">
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-black text-white min-w-[20px] text-center">{itemQuantity}</span>
                      <button type="button" onClick={async () => { const success = await addToCart(item, false, item.selectedColor, 1, item.selectedSize); if (!success) alert("نفذت الكمية المتاحة"); }} className="w-6 h-6 rounded-lg bg-slate-600 hover:bg-purple-500/30 hover:text-purple-400 flex items-center justify-center text-slate-300 transition">
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-600 pt-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-slate-400"><span>المنتجات</span><span>{cartTotal} ج</span></div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>مصاريف الشحن</span>
              {selectedGovId ? (
                // ✅ إصلاح: إضافة ? قبل length وتأمين الشرط
                (selectedGov?.zones?.length || 0) > 0 && !selectedZoneId ? <span className="text-slate-500">اختر المنطقة أولاً</span> : <span className="text-orange-400 font-bold">{shippingCost} ج</span>
              ) : <span className="text-slate-500">اختر المحافظة أولاً</span>}
            </div>
            <div className="flex justify-between text-sm text-slate-400"><span>طريقة الدفع</span><span className="text-green-400 font-bold">كاش عند الاستلام</span></div>
            <div className="flex justify-between text-xl font-black text-white mt-2 pt-2 border-t border-slate-600"><span>الإجمالي</span><span className="text-purple-400">{grandTotal} ج</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}