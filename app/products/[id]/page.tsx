"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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

  const { stock, reserved } = useProductStock(id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
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
        console.error("Error fetching product:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setQuantity(1);
    setSelectedColorIndex(0);
    setSelectedSizeIndex(0);
  }, [id]);

  const allImages = product?.images && product.images.length > 0
    ? product.images
    : product?.image
      ? [product.image]
      : [];

  const selectedColorName = useMemo(() => {
    return product?.colors && product.colors.length > 0
      ? product.colors[selectedColorIndex].name
      : undefined;
  }, [product, selectedColorIndex]);

  const selectedSize = useMemo(() => {
    return product?.sizes && product.sizes.length > 0
      ? product.sizes[selectedSizeIndex]
      : undefined;
  }, [product, selectedSizeIndex]);

  const cartQuantity = useMemo(() => {
    if (!product) return 0;
    return cart.reduce((sum, item) => {
      if (
        item.id === product.id &&
        item.selectedColor === selectedColorName &&
        item.selectedSize?.length === selectedSize?.length &&
        item.selectedSize?.width === selectedSize?.width
      ) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
  }, [cart, product, selectedColorName, selectedSize]);

  const availableStock = Math.max(0, stock - reserved);
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

  // ✅ إصلاح: حماية من null عند حساب السعر
  const finalItemPrice = useMemo(() => {
    if (!product) return 0;
    const sizeExtraPrice = selectedSize?.price ? parseFloat(selectedSize.price) || 0 : 0;
    return product.price + sizeExtraPrice;
  }, [product, selectedSize]);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAddToCart = async () => {
    if (!product || canAddMore <= 0) return;
    const success = await addToCart(product, true, selectedColorName, quantity, selectedSize);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      setQuantity(1);
    } else {
      alert("لم يتم إضافة المنتج إلى السلة، يرجى المحاولة مرة أخرى.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-24 text-center">
        <p className="text-xl text-slate-400 font-bold">جاري تحميل تفاصيل المنتج...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-24 text-center">
        <p className="text-xl text-red-400 font-bold">المنتج غير موجود!</p>
        <button onClick={() => router.push("/")} className="mt-5 text-purple-400 font-bold">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition mb-6 font-bold text-sm"
        >
          <ArrowRight size={18} /> العودة
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* قسم الصور */}
          <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative group">
            <div
              className="relative h-[320px] md:h-[400px] cursor-pointer overflow-hidden"
              onClick={() => setShowFullImage(true)}
            >
              {allImages.length > 0 ? (
                <Image
                  src={allImages[currentImageIndex]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-500">لا توجد صورة</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-bold">
                  اضغط لعرض الصورة
                </span>
              </div>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
                  >
                    <ChevronRight size={20} className="rtl:rotate-180" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
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
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className="transition-all"
                  >
                    {currentImageIndex === idx ? (
                      <CircleDot size={14} className="text-white fill-white" />
                    ) : (
                      <Circle size={10} className="text-white/60 hover:text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* قسم تفاصيل المنتج */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-purple-400 font-bold text-sm mb-1">{product.category}</p>
              <h1 className="text-2xl font-black text-white">{product.name}</h1>
            </div>

            {/* الألوان */}
            {product.colors && product.colors.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-3">
                  الألوان:
                  <span className="text-white ms-1">{product.colors[selectedColorIndex].name}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color: ProductColor, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColorIndex(index)}
                      title={color.name}
                      className={`w-12 h-12 rounded-full transition-all duration-200 border-2 flex items-center justify-center ${
                        selectedColorIndex === index
                          ? "border-purple-500 scale-110 shadow-lg shadow-purple-500/30"
                          : "border-slate-600 hover:border-slate-400"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selectedColorIndex === index && (
                        <Check
                          size={18}
                          className={isLightColor(color.hex) ? "text-black" : "text-white"}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* المقاسات */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-3">المقاسات:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSizeIndex(index)}
                      className={`px-4 py-3 flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 ${
                        selectedSizeIndex === index
                          ? "border-purple-500 bg-purple-600 text-white font-bold"
                          : "border-slate-600 hover:border-slate-400 bg-slate-700 text-slate-300"
                      }`}
                    >
                      <span className="text-sm">{size.length} × {size.width}</span>
                      {size.price && parseFloat(size.price) > 0 && (
                        <span className="text-[10px] mt-1 opacity-80">+{size.price} جنيه</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* السعر والخصم */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-purple-400">{finalItemPrice} جنيه</span>
              {product.originalPrice && (
                <span className="text-base text-slate-500 line-through">{product.originalPrice} جنيه</span>
              )}
              {discount > 0 && (
                <span className="bg-pink-500/20 text-pink-400 text-xs font-bold px-2 py-1 rounded-full border border-pink-500/30">
                  خصم {discount}%
                </span>
              )}
            </div>

            {/* الوصف */}
            {product.description && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <h3 className="text-sm font-bold text-purple-400 mb-1">الوصف</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* معلومات المخزون */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-purple-400" />
                <span className="text-slate-300 text-sm font-bold">
                  المتوفر: <span className="text-white ms-2">{stock}</span>
                </span>
              </div>
              {cartQuantity > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <ShoppingCart size={16} />
                  <span>في السلة: <span className="font-bold">{cartQuantity}</span></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className={`font-bold ${canAddMore > 0 ? "text-green-400" : "text-red-400"}`}>
                  {canAddMore > 0 ? `متاح للطلب: ${canAddMore}` : "نفذت الكمية"}
                </span>
              </div>
            </div>

            {/* اختيار الكمية */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-purple-600 transition"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-black min-w-[40px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(canAddMore || 1, q + 1))}
                disabled={canAddMore <= 0}
                className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 ms-auto">
                <span className="text-slate-400 text-xs">الإجمالي: </span>
                <span className="font-black text-purple-400 text-sm ms-1">{finalItemPrice * quantity} جنيه</span>
              </div>
            </div>

            {/* زر إضافة إلى السلة */}
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
              {added ? "تمت الإضافة للسلة" : canAddMore <= 0 ? "غير متوفر" : "إضافة إلى السلة"}
            </button>
          </div>
        </div>
      </div>

      {/* نافذة عرض الصورة بالكامل */}
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
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition z-50"
              >
                <ChevronRight size={28} className="rtl:rotate-180" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition z-50"
              >
                <ChevronLeft size={28} className="rtl:rotate-180" />
              </button>
            </>
          )}

          {allImages.length > 0 && (
            <Image
              src={allImages[currentImageIndex]}
              alt={product.name}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              priority
            />
          )}

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