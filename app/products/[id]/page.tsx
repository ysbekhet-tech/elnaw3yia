"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Product, ProductColor } from "@/types";
import {
  ShoppingCart,
  ArrowRight,
  Package,
  Plus,
  Minus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  Clock,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useProductStock } from "../../../hooks/useProductStock";

function isLightColor(hex: string) {
  if (!hex) return false;
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  
  // ✅ نستخدم الـ hook عشان نجيب المخزون المحدث لحظياً
  const { stock, reserved } = useProductStock(id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      doc(db, "products", id as string),
      (snap) => {
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        }
        setLoading(false);
      },
      (error) => {
        console.error("خطأ في جلب المنتج:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setQuantity(1);
    setSelectedColorIndex(0);
  }, [id]);

  const allImages = (product?.images && product.images.length > 0)
    ? product.images
    : product?.image
      ? [product.image]
      : [];

  const selectedColorName = useMemo(() => {
    return product?.colors && product.colors.length > 0
      ? product.colors[selectedColorIndex].name
      : undefined;
  }, [product, selectedColorIndex]);

  // ✅ كمية هذا المنتج (بنفس اللون) الموجودة في السلة
  const cartQuantity = useMemo(() => {
    if (!product) return 0;
    return cart.reduce((sum, item) => {
      if (
        item.id === product.id &&
        item.selectedColor === selectedColorName
      ) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
  }, [cart, product, selectedColorName]);

  // ✅ المتاح = stock - reserved (محدث لحظياً من Firebase)
  const availableStock = Math.max(0, stock - reserved);

  // ✅ الكمية اللي العميل يقدر يضيفها كمان
  const canAddMore = useMemo(() => {
    return Math.max(0, availableStock - cartQuantity);
  }, [availableStock, cartQuantity]);

  useEffect(() => {
    if (canAddMore > 0 && quantity > canAddMore) {
      setQuantity(canAddMore);
    } else if (canAddMore <= 0 && quantity > 1) {
      setQuantity(1);
    }
  }, [canAddMore, quantity]);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  };

  const handleAddToCart = async () => {
    if (!product || canAddMore <= 0) return;

    const success = await addToCart(product, true, selectedColorName, quantity);

    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      setQuantity(1);
    } else {
      alert("الكمية المطلوبة غير متوفرة حالياً. يرجى تحديث الصفحة.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-24 text-center">
        <p className="text-xl text-slate-400 font-bold">
          جاري تحميل بيانات المنتج...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-24 text-center">
        <p className="text-xl text-red-400 font-bold">
          عذراً، هذا المنتج غير موجود!
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-5 text-purple-400 font-bold"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition mb-6 font-bold text-sm"
        >
          <ArrowRight size={18} /> العودة للمنتجات
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative group">
            <div
              className="relative h-[320px] cursor-pointer overflow-hidden"
              onClick={() => setShowFullImage(true)}
            >
              <img
                src={
                  allImages[currentImageIndex] ||
                  "https://via.placeholder.com/600"
                }
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-bold">
                  اضغط لتكبير الصورة
                </span>
              </div>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
                  >
                    <ChevronRight size={20} className="rtl:rotate-180" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
                  >
                    <ChevronLeft size={20} className="rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className="transition-all"
                  >
                    {currentImageIndex === idx ? (
                      <CircleDot
                        size={14}
                        className="text-white fill-white"
                      />
                    ) : (
                      <Circle
                        size={10}
                        className="text-white/60 hover:text-white"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-purple-400 font-bold text-sm mb-1">
                {product.category}
              </p>
              <h1 className="text-2xl font-black text-white">
                {product.name}
              </h1>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-3">
                  اللون المختار:
                  <span className="text-white mr-1">
                    {product.colors[selectedColorIndex].name}
                  </span>
                </h3>
                <div className="flex items-center gap-3">
                  {product.colors.map(
                    (color: ProductColor, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColorIndex(index)}
                        title={color.name}
                        className={`relative w-10 h-10 rounded-full transition-all duration-200 border-2 flex items-center justify-center ${
                          selectedColorIndex === index
                            ? "border-purple-500 scale-110 shadow-lg shadow-purple-500/30"
                            : "border-slate-600 hover:border-slate-400"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {selectedColorIndex === index && (
                          <Check
                            size={18}
                            className={
                              isLightColor(color.hex)
                                ? "text-black"
                                : "text-white"
                            }
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-purple-400">
                {product.price} ج
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-500 line-through">
                  {product.originalPrice} ج
                </span>
              )}
              {discount > 0 && (
                <span className="bg-pink-500/20 text-pink-400 text-xs font-bold px-2 py-1 rounded-full border border-pink-500/30">
                  خصم {discount}%
                </span>
              )}
            </div>

            {product.description && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <h3 className="text-sm font-bold text-purple-400 mb-1">
                  وصف المنتج
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-purple-400" />
                <span className="text-slate-300 text-sm font-bold">
                  المخزون:{" "}
                  <span className="text-white mr-2">
                    {stock}
                  </span>
                </span>
              </div>
              {cartQuantity > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <ShoppingCart size={16} />
                  <span>
                    في السلة:{" "}
                    <span className="font-bold">{cartQuantity}</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`font-bold ${
                    canAddMore > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {canAddMore > 0
                    ? `متاح للإضافة: ${canAddMore}`
                    : "⚠️ نفذت الكمية المتاحة"}
                </span>
              </div>
              {cartQuantity > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  <span>محجوز لك لمدة 10 دقايق</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setQuantity((q) => Math.max(1, q - 1))
                }
                className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-purple-600 transition"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-black min-w-[40px] text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(canAddMore || 1, q + 1))
                }
                disabled={canAddMore <= 0}
                className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 ml-auto">
                <span className="text-slate-400 text-xs">الإجمالي:</span>
                <span className="font-black text-purple-400 text-sm mr-1">
                  {product.price * quantity} ج
                </span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={canAddMore <= 0}
              className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm ${
                added
                  ? "bg-green-500 text-white"
                  : canAddMore <= 0
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <ShoppingCart size={18} />
              {added
                ? "تمت الإضافة"
                : canAddMore <= 0
                  ? "نفذت الكمية"
                  : "أضف للسلة"}
            </button>
          </div>
        </div>
      </div>

      {showFullImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <button
            className="absolute top-5 left-5 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition z-50"
            onClick={() => setShowFullImage(false)}
          >
            <X size={28} />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition z-50"
              >
                <ChevronRight size={28} className="rtl:rotate-180" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition z-50"
              >
                <ChevronLeft size={28} className="rtl:rotate-180" />
              </button>
            </>
          )}

          <img
            src={
              allImages[currentImageIndex] ||
              "https://via.placeholder.com/600"
            }
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {allImages.length > 1 && (
            <div className="absolute bottom-5 text-white/50 text-sm font-bold">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}